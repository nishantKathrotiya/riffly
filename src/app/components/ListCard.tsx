"use client";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  RotateCw,
  BarChart2,
  Heart,
  PlusCircle,
  TrendingUp,
  Music,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

export type ListItem = {
  id: string;
  title: string;
  img?: string | null;
  right: string | number;
};

const getIconForTitle = (title: string) => {
  if (title.includes("Trending"))
    return <TrendingUp className="w-4 h-4 text-pink-500" />;
  if (title.includes("Like")) return <Heart className="w-4 h-4 text-red-500" />;
  if (title.includes("Add"))
    return <PlusCircle className="w-4 h-4 text-blue-500" />;
  if (title.includes("Likes"))
    return <BarChart2 className="w-4 h-4 text-green-500" />;
  return <Music className="w-4 h-4 text-purple-500" />;
};

export default function ListCard({
  title,
  items,
  loading,
  onRefresh,
}: {
  title: string;
  items: ListItem[];
  loading: boolean;
  onRefresh?: () => void;
}) {
  return (
    <div className="relative">
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getIconForTitle(title)}
              <h3 className="text-white font-bold text-lg">{title}</h3>
            </div>
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="outline"
                className="p-2 w-auto h-auto bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              >
                <RotateCw
                  className={`w-4 h-4 transition-transform duration-500 ${
                    loading ? "animate-spin [animation-duration:1.8s]" : ""
                  }`}
                />
              </Button>
            )}
          </div>

          <div className="space-y-2 h-[330px] overflow-y-auto pr-1 scroll-area">
            {loading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 h-16 rounded-lg bg-gray-800/50 animate-pulse"
                  >
                    <div className="flex items-center gap-3 h-full">
                      <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-3 w-32 bg-gray-700 rounded"></div>
                        <div className="h-2 w-16 bg-gray-800 rounded"></div>
                      </div>
                    </div>
                    <div className="h-6 w-8 bg-gray-700 rounded-full"></div>
                  </div>
                ))
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Music className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-gray-500 text-sm">No data available</p>
                <p className="text-gray-600 text-xs">
                  Add some songs to see them here
                </p>
              </div>
            ) : (
              items.map((it) => (
                <div
                  key={it.id}
                  className="group/item flex items-center justify-between p-2 h-16 min-h-[64px] rounded-lg transition-colors duration-200 hover:bg-gray-800/50"
                >
                  <div className="flex items-center h-full gap-3 min-w-0 flex-1 min-h-[48px]">
                    <div className="relative w-12 h-12 flex-shrink-0 flex items-center">
                      <div className="w-12 h-12 overflow-hidden rounded-lg bg-gray-800 flex-shrink-0">
                        {it.img ? (
                          <img
                            src={it.img}
                            alt=""
                            className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                            <Music className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600 cursor-pointer">
                              <span className="text-xs font-bold text-gray-200">
                                {items.indexOf(it) + 1}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-gray-800 text-white text-xs"
                          >
                            Song ranking
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-white text-sm font-medium truncate flex-1 pr-2">
                      {it.title}
                    </p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-6 min-w-[24px] flex items-center justify-center group/right">
                          <span className="px-2 py-1 text-xs font-semibold bg-gray-700/50 text-gray-300 rounded-full text-center flex items-center gap-1 group-hover/right:bg-gray-600/50 transition-colors cursor-pointer">
                            {it.right}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        className="bg-gray-800 text-white text-xs"
                      >
                        {title.includes("Trending") &&
                          "Trending score based on recent activity"}
                        {title.includes("Like") && "Number of likes"}
                        {title.includes("Add") && "Number of times added"}
                        {!title.includes("Trending") &&
                          !title.includes("Like") &&
                          !title.includes("Add") &&
                          "Count"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
