import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({
  children,
  className = '',
  hoverable = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200';
  const hoverClasses = hoverable || onClick ? 'hover:shadow-md hover:border-gray-300' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  const cardClasses = twMerge(
    baseClasses,
    hoverClasses,
    clickableClasses,
    className
  );

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div 
      className={cardClasses} 
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', withBorder = false }) => {
  const headerClasses = twMerge(
    'px-6 py-4',
    withBorder ? 'border-b border-gray-200' : '',
    className
  );

  return (
    <div className={headerClasses}>
      {typeof children === 'string' ? (
        <h3 className="text-lg font-medium text-gray-900">{children}</h3>
      ) : (
        children
      )}
    </div>
  );
};

const CardContent = ({ children, className = '', padding = true }) => {
  const contentClasses = twMerge(
    padding ? 'p-6' : '',
    className
  );

  return <div className={contentClasses}>{children}</div>;
};

const CardFooter = ({ children, className = '', withBorder = false }) => {
  const footerClasses = twMerge(
    'px-6 py-4',
    withBorder ? 'border-t border-gray-200' : '',
    'bg-gray-50',
    className
  );

  return <div className={footerClasses}>{children}</div>;
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
