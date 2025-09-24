import React from "react";
import Card from "./Card";
import InfoButton from "./Infobutton";

const CARD_HEIGHT = "h-[150px]";

interface OvershootDayInfoProps {
  countryName: string;
  overshootDate: string | null | undefined;
  selectedYear: number | string;
  worldOvershootDate?: string | null;
  onInfoClick?: () => void;
}


const OvershootDayInfo: React.FC<OvershootDayInfoProps> = ({ countryName, overshootDate, selectedYear, worldOvershootDate, onInfoClick }) => {

  return (
    <div className={`${CARD_HEIGHT} flex flex-col justify-center`}>
      <Card className="relative p-1 md:h-38 group" title={`${countryName.toLowerCase() === 'world' ? "World's" : `${countryName}'s`} Overshoot Day`}>

        <InfoButton info={countryName.toLowerCase() === 'world' ? 
          "The day on which the baseline’s average per person resource use surpasses Earth’s available resources per person" : 
          `The day on which ${countryName}'s average per person resource use surpasses Earth’s available resources per person`} />


        <div className="text-xl font-bold flex items-center gap-1 text-white">
          <span>
            {overshootDate ? new Date(overshootDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '—'}
          </span>
          <span className="text-slate-400 text-xl">{selectedYear}</span>
        </div>

        {countryName.toLowerCase() !== 'world' && typeof selectedYear === 'number' && overshootDate && worldOvershootDate ? (
          (() => {
            const curr = new Date(overshootDate);
            const world = new Date(worldOvershootDate);
            const diff = Math.round((curr.getTime() - world.getTime()) / (1000 * 60 * 60 * 24));
            if (diff === 0) return (
              <span className="text-yellow-400 text-base ml-2">No difference from world</span>
            );
            if (diff > 0) return (
              <span className="text-green-400 text-base flex items-center gap-1">
                <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>+</span>
                <span>{diff}</span>
                <span>days than world</span>
              </span>
            );
            if (diff < 0) return (
              <span className="text-red-400 text-base flex items-center gap-1">
                <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>-</span>
                <span>{Math.abs(diff)}</span>
                <span>days than world</span>
              </span>
            );
            return null;
          })()
        ) : (
          <div className="text-sm text-gray-400 mt-1">
            <span className="text-base mt-3 select-none">Baseline reference</span>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OvershootDayInfo;