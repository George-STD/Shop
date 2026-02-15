const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Categories data
const categoriesData = [
  {
    name: 'هدايا عيد الميلاد',
    slug: 'birthday-gifts',
    description: 'أفضل هدايا أعياد الميلاد لجميع الأعمار',
    image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400',
    icon: 'birthday-cake',
    order: 1
  },
  {
    name: 'هدايا الزفاف',
    slug: 'wedding-gifts',
    description: 'هدايا مميزة للعروسين',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
    icon: 'ring',
    order: 2
  },
  {
    name: 'باقات الورد',
    slug: 'flower-bouquets',
    description: 'باقات ورد طبيعية وصناعية',
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400',
    icon: 'leaf',
    order: 3
  },
  {
    name: 'الشوكولاتة والحلويات',
    slug: 'chocolates-sweets',
    description: 'أفخر أنواع الشوكولاتة والحلويات',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400',
    icon: 'cookie',
    order: 4
  },
  {
    name: 'العطور',
    slug: 'perfumes',
    description: 'عطور فاخرة للرجال والنساء',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
    icon: 'spray-can',
    order: 5
  },
  {
    name: 'الساعات والإكسسوارات',
    slug: 'watches-accessories',
    description: 'ساعات وإكسسوارات أنيقة',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400',
    icon: 'clock',
    order: 6
  },
  {
    name: 'الهدايا الشخصية',
    slug: 'personalized-gifts',
    description: 'هدايا مخصصة بالاسم أو الصورة',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400',
    icon: 'gift',
    order: 7
  },
  {
    name: 'هدايا المواليد',
    slug: 'baby-gifts',
    description: 'هدايا للمواليد الجدد',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400',
    icon: 'baby',
    order: 8
  },
  {
    name: 'ألعاب وهدايا الأطفال',
    slug: 'kids-toys',
    description: 'ألعاب وهدايا ممتعة للأطفال',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400',
    icon: 'gamepad',
    order: 9
  },
  {
    name: 'كروت الهدايا',
    slug: 'gift-cards',
    description: 'كروت هدايا للمتاجر المختلفة',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
    icon: 'credit-card',
    order: 10
  }
];

// Products data with correct enum values
const productsData = [
  // Birthday Gifts
  {
    name: 'باقة بالونات عيد ميلاد ملونة',
    slug: 'colorful-birthday-balloon-bouquet',
    description: 'باقة بالونات ملونة مكونة من 12 بالون هيليوم مع بالون كبير مكتوب عليه "Happy Birthday". مثالية لحفلات أعياد الميلاد.',
    price: 150,
    oldPrice: 199,
    discount: 25,
    images: [
      { url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500', alt: 'باقة بالونات عيد ميلاد' }
    ],
    categorySlug: 'birthday-gifts',
    tags: ['بالونات', 'عيد ميلاد', 'هيليوم'],
    occasions: ['birthday'],
    recipients: ['friend', 'child', 'anyone'],
    budgetRange: '100-300',
    stock: 50,
    sku: 'BD-BAL-001',
    isFeatured: true,
    rating: { average: 4.8, count: 45 }
  },
  {
    name: 'صندوق هدايا فاخر مع كيك',
    slug: 'luxury-gift-box-with-cake',
    description: 'صندوق هدايا فاخر يحتوي على كيك صغير، شمعة عطرية، وبطاقة تهنئة مخصصة.',
    price: 599,
    oldPrice: 750,
    discount: 20,
    images: [
      { url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500', alt: 'صندوق هدايا فاخر' }
    ],
    categorySlug: 'birthday-gifts',
    tags: ['صندوق هدايا', 'كيك', 'فاخر'],
    occasions: ['birthday'],
    recipients: ['wife', 'mother', 'friend'],
    budgetRange: '500-1000',
    stock: 30,
    sku: 'BD-BOX-001',
    isFeatured: true,
    isBestseller: true,
    rating: { average: 4.9, count: 89 }
  },

  // Flower Bouquets
  {
    name: 'باقة ورد أحمر رومانسية',
    slug: 'romantic-red-roses-bouquet',
    description: 'باقة من 24 وردة حمراء طبيعية مع ورق تغليف أنيق وشريطة ساتان.',
    price: 450,
    images: [
      { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500', alt: 'باقة ورد أحمر' }
    ],
    categorySlug: 'flower-bouquets',
    tags: ['ورد أحمر', 'طبيعي', 'رومانسي'],
    occasions: ['valentine', 'anniversary'],
    recipients: ['wife', 'girlfriend'],
    budgetRange: '300-500',
    stock: 25,
    sku: 'FL-RED-001',
    isFeatured: true,
    isBestseller: true,
    rating: { average: 4.9, count: 156 }
  },
  {
    name: 'باقة ورد مشكل ملون',
    slug: 'mixed-colorful-flowers-bouquet',
    description: 'باقة متنوعة من الورود الملونة تشمل الأبيض والوردي والأصفر والبرتقالي.',
    price: 280,
    oldPrice: 350,
    discount: 20,
    images: [
      { url: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=500', alt: 'باقة ورد مشكل' }
    ],
    categorySlug: 'flower-bouquets',
    tags: ['ورد مشكل', 'ملون'],
    occasions: ['graduation', 'get-well', 'thank-you'],
    recipients: ['mother', 'friend', 'colleague'],
    budgetRange: '100-300',
    stock: 40,
    sku: 'FL-MIX-001',
    rating: { average: 4.7, count: 78 }
  },
  {
    name: 'صندوق ورد أبيض فاخر',
    slug: 'luxury-white-roses-box',
    description: 'صندوق مخملي أسود يحتوي على ورود بيضاء طبيعية مرتبة بشكل أنيق.',
    price: 650,
    images: [
      { url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500', alt: 'صندوق ورد أبيض' }
    ],
    categorySlug: 'flower-bouquets',
    tags: ['ورد أبيض', 'صندوق', 'فاخر'],
    occasions: ['wedding', 'anniversary'],
    recipients: ['wife', 'girlfriend'],
    budgetRange: '500-1000',
    stock: 15,
    sku: 'FL-WHT-001',
    isFeatured: true,
    rating: { average: 5.0, count: 45 }
  },

  // Chocolates
  {
    name: 'علبة شوكولاتة بلجيكية فاخرة',
    slug: 'luxury-belgian-chocolate-box',
    description: 'علبة أنيقة تحتوي على 24 قطعة شوكولاتة بلجيكية متنوعة النكهات.',
    price: 350,
    images: [
      { url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500', alt: 'شوكولاتة بلجيكية' }
    ],
    categorySlug: 'chocolates-sweets',
    tags: ['شوكولاتة', 'بلجيكي', 'فاخر'],
    occasions: ['birthday', 'valentine', 'thank-you'],
    recipients: ['wife', 'mother', 'friend', 'anyone'],
    budgetRange: '300-500',
    stock: 60,
    sku: 'CH-BEL-001',
    isFeatured: true,
    isBestseller: true,
    rating: { average: 4.8, count: 234 }
  },
  {
    name: 'صندوق فيريرو روشيه 48 قطعة',
    slug: 'ferrero-rocher-48-box',
    description: 'صندوق فيريرو روشيه الذهبي يحتوي على 48 قطعة من الشوكولاتة الفاخرة.',
    price: 220,
    images: [
      { url: 'https://images.unsplash.com/photo-1548907040-4d42bfc29db4?w=500', alt: 'فيريرو روشيه' }
    ],
    categorySlug: 'chocolates-sweets',
    tags: ['فيريرو', 'شوكولاتة'],
    occasions: ['eid', 'birthday', 'congratulations'],
    recipients: ['colleague', 'boss', 'anyone'],
    budgetRange: '100-300',
    stock: 80,
    sku: 'CH-FER-001',
    isBestseller: true,
    rating: { average: 4.7, count: 189 }
  },
  {
    name: 'صندوق جوديفا المميز',
    slug: 'godiva-premium-box',
    description: 'صندوق جوديفا الفاخر يحتوي على تشكيلة من أفخر أنواع الشوكولاتة.',
    price: 750,
    images: [
      { url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=500', alt: 'شوكولاتة جوديفا' }
    ],
    categorySlug: 'chocolates-sweets',
    tags: ['جوديفا', 'شوكولاتة', 'فاخر'],
    occasions: ['wedding', 'anniversary'],
    recipients: ['wife', 'mother'],
    budgetRange: '500-1000',
    stock: 25,
    sku: 'CH-GOD-001',
    isFeatured: true,
    rating: { average: 4.9, count: 67 }
  },

  // Perfumes
  {
    name: 'عطر ديور سوفاج للرجال',
    slug: 'dior-sauvage-men',
    description: 'عطر ديور سوفاج الشهير للرجال، 100 مل. رائحة منعشة وقوية تدوم طويلاً.',
    price: 850,
    images: [
      { url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500', alt: 'عطر ديور سوفاج' }
    ],
    categorySlug: 'perfumes',
    tags: ['ديور', 'عطر رجالي', 'فاخر'],
    occasions: ['birthday', 'eid'],
    recipients: ['husband', 'boyfriend', 'father'],
    budgetRange: '500-1000',
    stock: 35,
    sku: 'PF-DIO-001',
    isFeatured: true,
    isBestseller: true,
    rating: { average: 4.9, count: 312 }
  },
  {
    name: 'عطر شانيل نمبر 5 للنساء',
    slug: 'chanel-no5-women',
    description: 'عطر شانيل الأيقوني رقم 5، 100 مل. العطر الأكثر شهرة في العالم.',
    price: 950,
    images: [
      { url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500', alt: 'عطر شانيل' }
    ],
    categorySlug: 'perfumes',
    tags: ['شانيل', 'عطر نسائي', 'فاخر'],
    occasions: ['birthday', 'mothers-day', 'anniversary'],
    recipients: ['wife', 'mother', 'girlfriend'],
    budgetRange: '500-1000',
    stock: 20,
    sku: 'PF-CHA-001',
    isFeatured: true,
    rating: { average: 4.8, count: 178 }
  },
  {
    name: 'عطر توم فورد بلاك أوركيد',
    slug: 'tom-ford-black-orchid',
    description: 'عطر توم فورد بلاك أوركيد الفاخر، 100 مل. رائحة فريدة وجذابة.',
    price: 1200,
    images: [
      { url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500', alt: 'عطر توم فورد' }
    ],
    categorySlug: 'perfumes',
    tags: ['توم فورد', 'عطر', 'فاخر'],
    occasions: ['anniversary', 'birthday'],
    recipients: ['wife', 'husband', 'anyone'],
    budgetRange: 'above-1000',
    stock: 15,
    sku: 'PF-TOM-001',
    isFeatured: true,
    rating: { average: 4.9, count: 89 }
  },

  // Watches & Accessories
  {
    name: 'ساعة كاسيو كلاسيكية',
    slug: 'casio-classic-watch',
    description: 'ساعة كاسيو الكلاسيكية الذهبية للرجال والنساء. تصميم أنيق وعصري.',
    price: 180,
    images: [
      { url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500', alt: 'ساعة كاسيو' }
    ],
    categorySlug: 'watches-accessories',
    tags: ['ساعة', 'كاسيو', 'كلاسيك'],
    occasions: ['birthday', 'graduation'],
    recipients: ['friend', 'colleague', 'anyone'],
    budgetRange: '100-300',
    stock: 45,
    sku: 'WT-CAS-001',
    isBestseller: true,
    rating: { average: 4.6, count: 234 }
  },
  {
    name: 'ساعة مايكل كورس للنساء',
    slug: 'michael-kors-women-watch',
    description: 'ساعة مايكل كورس الفاخرة للنساء باللون الوردي الذهبي.',
    price: 850,
    images: [
      { url: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500', alt: 'ساعة مايكل كورس' }
    ],
    categorySlug: 'watches-accessories',
    tags: ['ساعة', 'مايكل كورس', 'نسائي'],
    occasions: ['birthday', 'graduation', 'anniversary'],
    recipients: ['wife', 'girlfriend', 'mother'],
    budgetRange: '500-1000',
    stock: 20,
    sku: 'WT-MK-001',
    isFeatured: true,
    rating: { average: 4.8, count: 156 }
  },

  // Personalized Gifts
  {
    name: 'كوب مخصص بالاسم والصورة',
    slug: 'personalized-mug-photo',
    description: 'كوب سيراميك مخصص يمكن طباعة اسمك وصورتك عليه.',
    price: 75,
    images: [
      { url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500', alt: 'كوب مخصص' }
    ],
    categorySlug: 'personalized-gifts',
    tags: ['كوب', 'مخصص', 'صورة'],
    occasions: ['birthday', 'valentine', 'thank-you'],
    recipients: ['friend', 'colleague', 'anyone'],
    budgetRange: 'under-100',
    stock: 100,
    sku: 'PG-MUG-001',
    isBestseller: true,
    rating: { average: 4.5, count: 456 }
  },
  {
    name: 'قلادة محفور عليها الاسم',
    slug: 'engraved-name-necklace',
    description: 'قلادة ذهبية أنيقة محفور عليها الاسم بالعربي أو الإنجليزي.',
    price: 350,
    images: [
      { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500', alt: 'قلادة محفورة' }
    ],
    categorySlug: 'personalized-gifts',
    tags: ['قلادة', 'محفور', 'ذهب'],
    occasions: ['birthday', 'mothers-day', 'valentine'],
    recipients: ['wife', 'mother', 'girlfriend'],
    budgetRange: '300-500',
    stock: 40,
    sku: 'PG-NCK-001',
    isFeatured: true,
    rating: { average: 4.9, count: 189 }
  },

  // Baby Gifts
  {
    name: 'سلة هدايا للمولود الجديد',
    slug: 'newborn-gift-basket',
    description: 'سلة هدايا متكاملة للمولود الجديد تحتوي على ملابس ولعب وبطانية.',
    price: 450,
    images: [
      { url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500', alt: 'سلة هدايا مولود' }
    ],
    categorySlug: 'baby-gifts',
    tags: ['مولود', 'سلة هدايا', 'بيبي'],
    occasions: ['newborn'],
    recipients: ['friend', 'colleague', 'anyone'],
    budgetRange: '300-500',
    stock: 30,
    sku: 'BB-BSK-001',
    isFeatured: true,
    isBestseller: true,
    rating: { average: 4.8, count: 123 }
  },
  {
    name: 'طقم ملابس مولود قطن',
    slug: 'baby-cotton-clothes-set',
    description: 'طقم ملابس قطنية للمولود يشمل 5 قطع بألوان جميلة.',
    price: 180,
    images: [
      { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500', alt: 'ملابس مولود' }
    ],
    categorySlug: 'baby-gifts',
    tags: ['ملابس', 'مولود', 'قطن'],
    occasions: ['newborn'],
    recipients: ['friend', 'colleague'],
    budgetRange: '100-300',
    stock: 50,
    sku: 'BB-CLT-001',
    rating: { average: 4.6, count: 89 }
  },

  // Kids Toys
  {
    name: 'ليجو مجموعة البناء الكلاسيكية',
    slug: 'lego-classic-building-set',
    description: 'مجموعة ليجو الكلاسيكية تحتوي على 500 قطعة لبناء أي شيء تتخيله.',
    price: 250,
    images: [
      { url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500', alt: 'ليجو كلاسيك' }
    ],
    categorySlug: 'kids-toys',
    tags: ['ليجو', 'ألعاب', 'بناء'],
    occasions: ['birthday', 'eid'],
    recipients: ['child'],
    budgetRange: '100-300',
    stock: 35,
    sku: 'KD-LEG-001',
    isBestseller: true,
    rating: { average: 4.9, count: 567 }
  },
  {
    name: 'دمية باربي مع إكسسوارات',
    slug: 'barbie-doll-accessories',
    description: 'دمية باربي الأصلية مع مجموعة إكسسوارات وملابس.',
    price: 180,
    images: [
      { url: 'https://images.unsplash.com/photo-1613682988402-8d644d4c71ae?w=500', alt: 'دمية باربي' }
    ],
    categorySlug: 'kids-toys',
    tags: ['باربي', 'دمية', 'بنات'],
    occasions: ['birthday', 'eid'],
    recipients: ['child'],
    budgetRange: '100-300',
    stock: 45,
    sku: 'KD-BAR-001',
    rating: { average: 4.7, count: 234 }
  },

  // Gift Cards
  {
    name: 'بطاقة هدايا أمازون',
    slug: 'amazon-gift-card',
    description: 'بطاقة هدايا أمازون بقيمة 500 جنيه للتسوق من أي منتج.',
    price: 500,
    images: [
      { url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500', alt: 'بطاقة أمازون' }
    ],
    categorySlug: 'gift-cards',
    tags: ['بطاقة', 'أمازون', 'تسوق'],
    occasions: ['birthday', 'eid', 'graduation'],
    recipients: ['anyone'],
    budgetRange: '300-500',
    stock: 100,
    sku: 'GC-AMZ-001',
    isBestseller: true,
    rating: { average: 4.8, count: 890 }
  },
  {
    name: 'بطاقة هدايا ستاربكس',
    slug: 'starbucks-gift-card',
    description: 'بطاقة هدايا ستاربكس بقيمة 150 جنيه للاستمتاع بأفضل القهوة.',
    price: 150,
    images: [
      { url: 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=500', alt: 'بطاقة ستاربكس' }
    ],
    categorySlug: 'gift-cards',
    tags: ['بطاقة', 'ستاربكس', 'قهوة'],
    occasions: ['birthday', 'thank-you'],
    recipients: ['friend', 'colleague', 'anyone'],
    budgetRange: '100-300',
    stock: 150,
    sku: 'GC-SBX-001',
    rating: { average: 4.7, count: 567 }
  }
];

async function seedDatabase() {
  try {
    console.log('Clearing existing data...');
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({ role: 'admin' }); // Only delete admin users

    // Create admin user
    console.log('Creating admin user...');
    const adminUser = await User.create({
      firstName: 'مدير',
      lastName: 'النظام',
      email: 'admin@foryou-gifts.com',
      phone: '+201000000000',
      password: 'Admin@123456',
      role: 'admin',
      isActive: true,
      isVerified: true
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);
    console.log('   Password: Admin@123456');

    console.log('Creating categories...');
    const categories = await Category.insertMany(categoriesData);
    console.log(`Created ${categories.length} categories`);

    // Create a map of slug to category ID
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    console.log('Creating products...');
    const productsWithCategory = productsData.map(product => ({
      ...product,
      category: categoryMap[product.categorySlug]
    }));

    // Remove categorySlug from products
    productsWithCategory.forEach(p => delete p.categorySlug);

    const products = await Product.insertMany(productsWithCategory);
    console.log(`Created ${products.length} products`);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
