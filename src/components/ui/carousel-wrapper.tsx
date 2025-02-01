import useEmblaCarousel from "embla-carousel-react";
import React, { useCallback, useEffect, useState } from "react";

interface EmblaCarouselWrapperProps {
  images: string[];
}

const EmblaCarouselWrapper: React.FC<EmblaCarouselWrapperProps> = ({
  images,
}) => {
  // Initialize Embla with desired options.
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Update the selected index when the carousel slide changes.
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  return (
    <div className="embla">
      {/* Embla viewport for swipe navigation */}
      <div className="embla__viewport overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {images.map((image, idx) => (
            <div key={idx} className="embla__slide flex-shrink-0 w-full">
              <div className="aspect-[16/9] overflow-hidden rounded-md">
                <img
                  src={image}
                  alt={`Slide ${idx + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false} // Prevent default drag behavior
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segmented progress indicator (only shows if there's more than one image) */}
      {images.length > 1 && (
        <div className="flex space-x-2 mt-2">
          {images.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded-full transition-all duration-300 cursor-pointer ${
                index === selectedIndex ? "bg-white" : "bg-white/30"
              }`}
              onClick={() => {
                if (emblaApi) emblaApi.scrollTo(index);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EmblaCarouselWrapper;
