import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facebook, Youtube, Instagram, MessageSquare } from 'lucide-react';

const TikTokIcon = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.84 2.91 2.08 3.67.01 1.25.01 2.5 0 3.75-1.34-.01-2.58-.69-3.37-1.78-.02 1.93-.01 3.86-.01 5.79 0 2.27-1.02 4.41-2.88 5.48-2.39 1.48-5.69.84-7.29-1.42-1.76-2.38-.85-6.09 1.91-7.18.97-.39 2.05-.39 3.03-.02v3.91c-.69-.26-1.48-.19-2.09.24-.87.56-1.12 1.76-.56 2.62.53.84 1.63 1.13 2.5.6.87-.51 1.16-1.63.74-2.58-.02-3.41-.01-6.82-.01-10.23.01-.22-.05-.48.1-.67.35-.46.9-.62 1.47-.56Z" />
  </svg>
);

const getPlatformIcon = (platform = 'facebook', isDark = false) => {
  const iconClass = "w-5 h-5 shrink-0";
  const colorClass = isDark ? "text-white" : "text-brand-green";
  switch (platform.toLowerCase()) {
    case 'youtube':
      return <Youtube className={`${iconClass} ${isDark ? 'text-white' : 'text-red-500'}`} />;
    case 'facebook':
      return <Facebook className={`${iconClass} ${isDark ? 'text-white' : 'text-blue-600'}`} />;
    case 'instagram':
      return <Instagram className={`${iconClass} ${isDark ? 'text-white' : 'text-pink-500'}`} />;
    case 'tiktok':
      return <TikTokIcon className={`${iconClass} ${isDark ? 'text-white' : 'text-zinc-700'}`} />;
    default:
      return <MessageSquare className={`${iconClass} ${colorClass}`} />;
  }
};

const renderAvatar = (comment, isGlass = true) => {
  const sizeClass = "w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-black text-sm uppercase shadow-inner";
  if (comment.avatar) {
    return <img src={comment.avatar} alt={comment.username} className={`${sizeClass} object-cover`} />;
  }
  const initials = comment.username ? comment.username.split(" ").map(w => w[0]).join("").slice(0, 2) : "UN";
  const bgStyle = isGlass ? "bg-white/20 text-white" : "bg-brand-gold text-brand-charcoal";
  return (
    <div className={`${sizeClass} ${bgStyle}`}>
      {initials}
    </div>
  );
};

const commentVariants = {
  initial: { opacity: 0, y: 35, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: -60, scale: 0.95, transition: { duration: 0.25 } }
};

export function CommentsWidget({ 
  comments = [], 
  variant = 'A', 
  isOpen = true, 
  className = '' 
}) {
  return (
    <div 
      className={`absolute left-[80px] top-[110px] bottom-[240px] w-[500px] z-30 flex flex-col justify-center gap-4 pointer-events-none ${className}`}
    >
      <AnimatePresence initial={false}>
        {isOpen && comments.map((comment) => (
          variant === 'A' ? (
            /* Variant A: Clean Floating Glass (High Contrast) */
            <motion.div
              key={comment.id}
              variants={commentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              className="backdrop-blur-md bg-brand-charcoal/95 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-5 rounded-2xl flex gap-4 items-start pointer-events-auto"
            >
              {renderAvatar(comment, true)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-display font-black text-lg tracking-wider uppercase text-brand-gold truncate">
                    {comment.username}
                  </span>
                  {getPlatformIcon(comment.platform, true)}
                </div>
                <p className="font-sans text-xl sm:text-2xl text-white leading-relaxed font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] break-words">
                  {comment.message}
                </p>
              </div>
            </motion.div>
          ) : (
            /* Variant B: Premium Split-Block */
            <motion.div
              key={comment.id}
              variants={commentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              className="bg-white rounded-2xl shadow-[8px_8px_24px_rgba(0,0,0,0.1)] border border-black/5 overflow-hidden flex items-stretch min-h-[90px] pointer-events-auto"
            >
              {/* Left Block */}
              <div className="bg-brand-charcoal w-[70px] shrink-0 flex flex-col items-center justify-center border-r border-black/5 p-2">
                {renderAvatar(comment, false)}
              </div>
              
              {/* Right White Body */}
              <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-display font-black text-lg tracking-wide uppercase text-brand-charcoal truncate">
                    {comment.username}
                  </span>
                  {getPlatformIcon(comment.platform, false)}
                </div>
                <p className="font-sans text-xl sm:text-2xl text-brand-charcoal/90 leading-snug font-bold break-words">
                  {comment.message}
                </p>
              </div>
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </div>
  );
}

export default CommentsWidget;
