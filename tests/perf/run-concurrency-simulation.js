const path = require('path');
// Ensure backend node_modules are resolvable regardless of where script is invoked
module.paths.push(path.join(__dirname, '../../backend/node_modules'));

const http = require('http');
const { spawn, execSync } = require('child_process');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

const User = require('../../backend/models/User');
const Product = require('../../backend/models/Product');
const Order = require('../../backend/models/Order');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const PORT = 5000;
const INITIAL_STOCK = 5;
const CONCURRENT_VUS = 20;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: check if server is reachable
const isServerRunning = () => {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
};

async function runSimulation() {
  console.log('\n===============================================================');
  console.log('  🚀 محاكاة التزامن ومنع البيع الزائد (Inventory Concurrency)');
  console.log('===============================================================\n');

  let serverProcess = null;
  let testUser = null;
  let testProduct = null;

  try {
    // 1. Ensure backend is running
    const running = await isServerRunning();
    if (!running) {
      console.log('⚡ السيرفر المحلي غير نشط. جاري تشغيل سيرفر الاختبار مع تعطيل الـ Rate Limit للمحاكاة...');
      serverProcess = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '../../backend'),
        env: {
          ...process.env,
          PORT: String(PORT),
          ENABLE_PERF_TESTING: 'true',
          NODE_ENV: 'development',
        },
        stdio: 'inherit',
      });

      // Poll until server is ready
      let ready = false;
      for (let attempt = 1; attempt <= 25; attempt++) {
        await delay(1000);
        if (await isServerRunning()) {
          ready = true;
          break;
        }
      }

      if (!ready) {
        throw new Error('فشل بدء سيرفر الاختبار المحلي خلال 25 ثانية.');
      }
      console.log('✅ تم تشغيل السيرفر المحلي بنجاح وجاهز لاستقبال الطلبات.');
    } else {
      console.log('✅ السيرفر المحلي يعمل بالفعل وجاهز للاختبار.');
    }

    // 2. Connect to MongoDB
    console.log('🔌 جاري الاتصال بقاعدة البيانات MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ تم الاتصال بقاعدة البيانات.');

    // 3. Create isolated test user
    const userTimestamp = Date.now();
    testUser = await User.create({
      firstName: 'محاكاة',
      lastName: 'تزامن',
      email: `perf_concurrency_${userTimestamp}@test.local`,
      phone: '01012345678',
      password: 'PerfPassword123!',
      role: 'user',
      isActive: true,
      isVerified: true,
    });

    const authToken = jwt.sign(
      { id: testUser._id.toString(), v: testUser.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: '1h', algorithm: 'HS256' }
    );
    console.log(`👤 تم إنشاء مستخدم اختبار معزول: ${testUser.email}`);

    // 4. Create isolated test product with INITIAL_STOCK = 5
    testProduct = await Product.create({
      name: 'منتج محاكاة السباق والتزامن (Atomic Test)',
      slug: `perf-race-test-${userTimestamp}`,
      description: 'منتج مخصص لاختبار حماية المخزون والـ Race Conditions',
      price: 150,
      stock: INITIAL_STOCK,
      isActive: true,
    });
    console.log(`📦 تم إنشاء منتج اختبار معزول: [${testProduct.name}]`);
    console.log(`   - معرف المنتج (ID): ${testProduct._id}`);
    console.log(`   - المخزون الأولي: ${INITIAL_STOCK} قطع`);
    console.log(`   - عدد المستخدمين المتزامنين: ${CONCURRENT_VUS} طلبات متزامنة في نفس اللحظة`);
    console.log(`   - النتيجة الذرية المتوقعة: نجاح 5 طلبات بالضبط (201) ورفض 15 طلب بنفاد المخزون (400)\n`);

    // 5. Execute k6 Concurrency Test
    console.log('⏱️ جاري إطلاق سكريبت k6 لمحاكاة الهجوم المتزامن على المنتج...');
    const k6ScriptPath = path.join(__dirname, 'concurrency-order-test.js');

    const k6Env = {
      ...process.env,
      BASE_URL,
      PRODUCT_ID: testProduct._id.toString(),
      AUTH_TOKEN: authToken,
    };

    try {
      execSync(`k6 run -e BASE_URL="${BASE_URL}" -e PRODUCT_ID="${testProduct._id}" -e AUTH_TOKEN="${authToken}" "${k6ScriptPath}"`, {
        stdio: 'inherit',
        env: k6Env,
      });
    } catch (k6Err) {
      // k6 exits with non-zero if thresholds fail
      console.log('⚠️ انتهى تنفيذ k6 مع وجود تنبيهات في الحدود (Thresholds).');
    }

    // 6. Post-Simulation Database Verification
    console.log('\n🔍 جاري الفحص والتحقق من قاعدة البيانات مباشرة للتأكد من الذرية (Atomicity):');
    const updatedProduct = await Product.findById(testProduct._id).lean();
    const createdOrders = await Order.find({ user: testUser._id }).lean();

    console.log('---------------------------------------------------------------');
    console.log(`📦 المخزون الأولي:             ${INITIAL_STOCK}`);
    console.log(`📦 المخزون النهائي في الـ DB:   ${updatedProduct ? updatedProduct.stock : 'N/A'}`);
    console.log(`🛒 إجمالي الطلبات التي تم إنشاؤها: ${createdOrders.length}`);
    console.log(`🚫 الطلبات المرفوضة لنفاد الكمية: ${CONCURRENT_VUS - createdOrders.length}`);
    console.log('---------------------------------------------------------------');

    const stockIsZero = updatedProduct && updatedProduct.stock === 0;
    const ordersMatchStock = createdOrders.length === INITIAL_STOCK;
    const noOverselling = stockIsZero && ordersMatchStock;

    if (noOverselling) {
      console.log('\n🎉 النتيجة: نجاح باهر! (TEST PASSED ✅)');
      console.log('🛡️ تم منع البيع الزائد (Overselling) بنسبة 100%.');
      console.log('⚡ المعاملات الذرية (Atomic Operations) في MongoDB تعمل بدقة متناهية.');
      console.log('🔒 لا يوجد أي Race Condition أو تضارب في المخزون.');
    } else {
      console.error('\n❌ النتيجة: فشل الاختبار! (TEST FAILED ❌)');
      console.error(`⚠️ حدث تضارب في المخزون: المخزون النهائي = ${updatedProduct?.stock}, الطلبات = ${createdOrders.length}`);
    }

  } catch (err) {
    console.error('❌ خطأ أثناء تشغيل المحاكاة:', err);
  } finally {
    // 7. Guaranteed Cleanup
    console.log('\n🧹 جاري تنظيف بيانات الاختبار المعزولة من قاعدة البيانات...');
    try {
      if (testUser) {
        await Order.deleteMany({ user: testUser._id });
        await User.deleteOne({ _id: testUser._id });
      }
      if (testProduct) {
        await Product.deleteOne({ _id: testProduct._id });
      }
      console.log('✅ تم حذف بيانات الاختبار المؤقتة بالكامل بنجاح وبأمان.');
    } catch (cleanErr) {
      console.error('⚠️ خطأ أثناء التنظيف:', cleanErr.message);
    }

    try {
      await mongoose.disconnect();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات.');
    } catch (_) {}

    if (serverProcess) {
      console.log('🛑 إيقاف سيرفر الاختبار المحلي المؤقت...');
      try {
        serverProcess.kill('SIGTERM');
      } catch (_) {}
    }

    console.log('\n🏁 اكتملت المحاكاة بالكامل.\n');
  }
}

runSimulation();
