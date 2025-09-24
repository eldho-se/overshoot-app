import React from 'react';
import InfoButton from './Infobutton';

type Props = React.PropsWithChildren<{
  title?: string;
  className?: string;
  headerRight?: React.ReactNode;
}>;

const Card: React.FC<Props> = ({ title, headerRight, className = '', children }) => {
  return (
    <section className={`rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur p-3 py-5 ${className}`}>
      {(title || headerRight) && (
        <div className="mb-4 flex items-center justify-between">
          {title ? (
            <h2 className="text-slate-200 text-lg font-semibold tracking-tight">{title}</h2>
          ) : <div />}
          {headerRight}
        </div>
               
      )}
      
      {children}
    </section>
  );
};

export default Card;

