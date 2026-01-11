"use client";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { RotateCw } from "lucide-react";

export type ListItem = {
  id: string;
  title: string;
  img?: string | null;
  right: string | number;
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
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">{title}</h3>
          {onRefresh ? (
            <Button
              onClick={onRefresh}
              variant="outline"
              className="p-2 w-auto h-auto   bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            >
              <RotateCw
                className={`w-4 h-4 transition-transform duration-500 ${
                  loading
                    ? "animate-spin [animation-duration:1.8s] ease-in-out"
                    : ""
                }`}
              />
            </Button>
          ) : null}
        </div>
        <div className="space-y-3 max-h-64 lg:max-h-72 overflow-y-auto pr-1 scroll-area">
          {loading ? (
            <>
              <div className="h-4 rounded bg-gray-800 animate-pulse" />
              <div className="h-4 rounded bg-gray-800 animate-pulse" />
              <div className="h-4 rounded bg-gray-800 animate-pulse" />
            </>
          ) : items.length === 0 ? (
            <p className="text-gray-500 text-sm">No data</p>
          ) : (
            items.map((it) => (
              <div key={it.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {it.img ? (
                    <img
                      src={it.img}
                      alt=""
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-800 rounded" />
                  )}
                  <p className="text-white text-sm truncate">{it.title}</p>
                </div>
                <span className="text-gray-300 text-sm ml-3">{it.right}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
