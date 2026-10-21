import { useNavigate } from "react-router-dom";
import { BiStar, BiTimeFive } from "react-icons/bi";

type Props = {
  id: string;
  image: string;
  name: string;
  distance: string;
  isOpen: boolean;
};

const RestaurantCard = ({ id, image, name, distance, isOpen }: Props) => {
  const navigate = useNavigate();

  // Pseudo-random rating based on name length for visual richness
  const rating = (4.1 + ((name.length % 8) * 0.1)).toFixed(1);
  const deliveryMins = Math.max(15, Math.round(parseFloat(distance) * 8 + 15));

  return (
    <div
      onClick={() => navigate(`/restaurant/${id}`)}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100/90 shadow-[0_2px_10px_rgba(13,34,64,0.04)] hover:shadow-[0_12px_28px_rgba(13,34,64,0.12)] hover:-translate-y-1.5 hover:border-slate-200 transition-all duration-300 cursor-pointer"
    >
      {/* Image Container with Badges */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={name}
          className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
            !isOpen ? "grayscale filter" : ""
          }`}
          loading="lazy"
        />

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Floating Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {isOpen ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Open Now
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-rose-600/90 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
              Closed
            </span>
          )}

          {/* Distance Tag */}
          <span className="rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white/95">
            {distance} km
          </span>
        </div>

        {/* Floating Bottom Delivery Time Tag */}
        {isOpen && (
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[11px] font-semibold text-white/95 drop-shadow-sm">
            <BiTimeFive className="text-[#FB8C00]" size={14} />
            <span>{deliveryMins}–{deliveryMins + 10} mins</span>
          </div>
        )}
      </div>

      {/* Restaurant Info Content */}
      <div className="flex flex-1 flex-col justify-between p-3.5 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm sm:text-base text-[#0D2240] line-clamp-1 group-hover:text-[#FB8C00] transition-colors duration-200">
            {name}
          </h3>

          {/* Rating Pill */}
          <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/60 shrink-0">
            <BiStar size={12} className="fill-amber-500 text-amber-500" />
            {rating}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
          <span className="truncate">Fast Delivery • Quality Food</span>
          <span className="text-[11px] font-medium text-slate-400">₹200 for one</span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
