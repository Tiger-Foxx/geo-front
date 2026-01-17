import { motion, type HTMLMotionProps } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  className?: string;
  children: React.ReactNode;
}

export const GlassPanel = ({ className, children, ...props }: GlassPanelProps) => {
  return (
    <motion.div
      className={twMerge(
        "bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
