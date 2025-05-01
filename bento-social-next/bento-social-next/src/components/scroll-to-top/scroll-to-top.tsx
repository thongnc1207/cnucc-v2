import React from 'react';
import { Button } from '../button';

interface ScrollToTopProps {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export const ScrollToTop = ({ scrollContainerRef }: ScrollToTopProps) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      setIsVisible(scrollTop > 150);
    }
  };

  React.useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [scrollContainerRef]);

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-20 right-6 z-50 size-10 rounded-full bg-neutral2-10 hover:bg-neutral2-15 md:bottom-6"
      child={
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className="text-secondary"
        >
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
      }
    />
  );
};