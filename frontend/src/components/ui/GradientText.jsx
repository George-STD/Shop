import React from 'react';

const GradientText = ({ 
  children, 
  className = '', 
  from = 'from-purple-600', 
  via = 'via-fuchsia-500', 
  to = 'to-pink-500',
  as: Component = 'span' 
}) => {
  return (
    <Component
      className={`text-transparent bg-clip-text bg-gradient-to-r ${from} ${via ? via : ''} ${to} ${className}`}
    >
      {children}
    </Component>
  );
};

export default GradientText;
