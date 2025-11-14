import { useMemo } from 'react';
import { countSMSCharacters, formatMessageWithTokens } from '../../utils/smsParser';

export default function IPhonePreview({ message = '' }) {
  const smsInfo = useMemo(() => countSMSCharacters(message), [message]);
  const messageParts = useMemo(() => formatMessageWithTokens(message), [message]);

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* iPhone Frame */}
      <div className="relative bg-primary-dark rounded-3xl p-2 shadow-glass-lg">
        {/* Outer frame with subtle highlights */}
        <div className="relative bg-gradient-to-b from-primary-dark via-surface-dark to-primary-dark rounded-[28px] p-1">
          {/* Inner screen */}
          <div
            className="relative rounded-[24px] overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #020202 0%, #191819 45%, #262425 100%)',
              aspectRatio: '9 / 19.5', // iPhone 17 aspect ratio
            }}
          >
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-4 text-white/90 text-xs">
              <div className="flex items-center gap-1">
                <span className="font-medium">9:41</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 22h20V2z" />
                </svg>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 9l2-2v14l-2-2V9zm4-2l2-2v14l-2-2V7zm4-2l2-2v14l-2-2V5zm4-2l2-2v14l-2-2V3zm4-2l2-2v14l-2-2V1z" />
                </svg>
                <div className="w-6 h-3 border border-white/90 rounded-sm">
                  <div className="w-4 h-2 bg-white/90 rounded-sm m-0.5" />
                </div>
              </div>
            </div>

            {/* Message Content Area */}
            <div className="absolute inset-0 pt-12 pb-20 px-4 flex flex-col justify-start">
              {/* Message Bubble */}
              {message ? (
                <div className="w-full flex flex-col items-start gap-2">
                  <div
                    className="relative max-w-[80%] rounded-[20px] rounded-tl-[4px] px-3.5 py-2.5"
                    style={{
                      background: 'linear-gradient(135deg, #99B5D7 0%, #B3CDDA 100%)',
                    }}
                  >
                    <div className="text-primary-dark text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words">
                      {messageParts.map((part, index) => {
                        if (part.type === 'token') {
                          return (
                            <span
                              key={index}
                              className="font-semibold underline decoration-primary-dark/50 decoration-1 underline-offset-1"
                            >
                              {part.content}
                            </span>
                          );
                        }
                        return <span key={index}>{part.content}</span>;
                      })}
                    </div>
                  </div>

                  {/* Character Counter */}
                  <div className="self-end pr-2">
                    <div
                      className={`text-xs flex items-center gap-1 ${
                        smsInfo.parts > 1
                          ? 'text-zoom-fuchsia font-medium'
                          : 'text-white/60'
                      }`}
                    >
                      <span>
                        {smsInfo.count} {smsInfo.count === 1 ? 'character' : 'characters'}
                      </span>
                      <span>•</span>
                      <span
                        className={
                          smsInfo.parts > 1 ? 'text-zoom-fuchsia font-semibold' : ''
                        }
                      >
                        {smsInfo.parts} {smsInfo.parts === 1 ? 'SMS part' : 'SMS parts'}
                      </span>
                    </div>
                    {smsInfo.parts > 1 && (
                      <p className="text-xs text-zoom-fuchsia mt-1 font-medium">
                        This message will be split into {smsInfo.parts} parts
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full flex items-center justify-center h-full">
                  <p className="text-white/40 text-sm">Type a message to see preview</p>
                </div>
              )}
            </div>

            {/* Bottom Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

