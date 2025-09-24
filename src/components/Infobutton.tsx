import React, { useState } from "react";

import { ReactNode } from "react";

interface InfoButtonProps {
  info: string | ReactNode;
  className?: string;
  url?: {
    url: string;
    hyperlink: string;
  };
}

const InfoButton: React.FC<InfoButtonProps> = ({ info, className, url }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className={"z-50 " + (className || "")}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        type="button"
        aria-label="More info"
        className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center text-slate-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-all duration-150 bg-transparent shadow-none opacity-0 group-hover:opacity-100"
      >
        <span className="text-[16px] font-semibold leading-none">&#9432;</span>
      </button>
      {show && (
        <div className="absolute z-100000 right-0 top-6 bg-slate-800 text-white text-sm rounded shadow-xl px-3 py-2 min-w-[260px] max-w-[300px]">
          <div>
            {typeof info === "string" ? info : info}
          </div>
          {url && url.url && url.hyperlink && (
            <div className="mt-2">
              <a
                href={url.url}
                target="_blank"
                rel="noopener noreferrer"
                className=" text-[#5d7389] italic hover:text-blue-300 break-all"
              >
                {url.hyperlink}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InfoButton;
