const sizeClasses = {
  sm: {
    mark: 'w-10 h-10',
    image: 'w-10 h-10 object-contain',
    frame: 'rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-200',
    title: 'text-base',
    subtitle: 'text-xs',
  },
  compact: {
    mark: 'w-14 h-10',
    image: 'w-14 h-10 object-contain',
    frame: 'overflow-hidden',
    title: 'text-sm',
    subtitle: 'text-xs',
  },
  md: {
    mark: 'w-14 h-14',
    image: 'w-14 h-14 object-contain',
    frame: 'rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-200',
    title: 'text-lg',
    subtitle: 'text-sm',
  },
  full: {
    mark: 'w-36 h-11',
    image: 'w-36 h-11 object-contain',
    frame: 'rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-200',
    title: 'text-lg',
    subtitle: 'text-sm',
  },
};

export default function BrandLogo({
  size = 'sm',
  showText = true,
  subtitle = 'Employee Portal',
  className = '',
  textClassName = '',
}) {
  const styles = sizeClasses[size] || sizeClasses.sm;

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <div className={`${styles.mark} ${styles.frame} shrink-0`}>
        <img
          src="/image.avif"
          alt="Prem Industries"
          className={`${styles.image} block`}
        />
      </div>
      {showText && (
        <div className={`min-w-0 ${textClassName}`}>
          <p className={`${styles.title} font-bold leading-tight truncate`}>Prem Industries</p>
          {subtitle && <p className={`${styles.subtitle} text-slate-500 leading-tight truncate`}>{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
