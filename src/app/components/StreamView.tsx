"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent } from "@/src/components/ui/card";
import { ChevronUp, ChevronDown, Share2, Play, Sparkles } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Appbar } from "./Appbar";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { YT_REGEX } from "../lib/utils";
import YouTubePlayer from "youtube-player";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  getQueue,
  addStream as addStreamApi,
  upvoteStream,
  downvoteStream,
  nextStream as nextStreamApi,
  emptyQueue as emptyQueueApi,
  removeStream as removeStreamApi,
} from "@/src/app/intigrations/streams";

interface Video {
  id: string;
  type: string;
  url: string;
  extractedId: string;
  title: string;
  smallImg: string;
  bigImg: string;
  active: boolean;
  userId: string;
  upvotes: number;
  haveUpvoted: boolean;
  user: { email: string };
  addedBy: { email: string };
}

interface CustomSession extends Session {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const REFRESH_INTERVAL_MS = 10 * 1000;

export default function StreamView({
  creatorId,
  playVideo = false,
}: {
  creatorId: string;
  playVideo: boolean;
}) {
  const router = useRouter();
  const [inputLink, setInputLink] = useState("");
  const [queue, setQueue] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [playNextLoader, setPlayNextLoader] = useState(false);
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const [creatorUserId, setCreatorUserId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isEmptyQueueDialogOpen, setIsEmptyQueueDialogOpen] = useState(false);

  async function refreshStreams() {
    try {
      const json = await getQueue(creatorId);
      if (json.streams && Array.isArray(json.streams)) {
        setQueue(
          json.streams.length > 0
            ? json.streams.sort((a: any, b: any) => b.upvotes - a.upvotes)
            : []
        );
      } else {
        setQueue([]);
      }

      setCurrentVideo((video) => {
        if (video?.id === json.activeStream?.stream?.id) {
          return video;
        }
        return json.activeStream?.stream || null;
      });

      // Set the creator's ID
      setCreatorUserId(json.creatorUserId);
      setIsCreator(json.isCreator);
    } catch (error) {
      console.error("Error refreshing streams:", error);
      setQueue([]);
      setCurrentVideo(null);
    }
  }

  useEffect(() => {
    refreshStreams();
    const interval = setInterval(refreshStreams, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [creatorId]);

  useEffect(() => {
    if (!videoPlayerRef.current || !currentVideo) return;

    const player = YouTubePlayer(videoPlayerRef.current);
    player.loadVideoById(currentVideo.extractedId);
    player.playVideo();

    const eventHandler = (event: { data: number }) => {
      if (event.data === 0) {
        playNext();
      }
    };
    player.on("stateChange", eventHandler);

    return () => {
      player.destroy();
    };
  }, [currentVideo, videoPlayerRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputLink.trim()) {
      toast.error("YouTube link cannot be empty");
      return;
    }
    if (!inputLink.match(YT_REGEX)) {
      toast.error("Invalid YouTube URL format");
      return;
    }
    setLoading(true);
    try {
      const data = await addStreamApi({ creatorId, url: inputLink });
      setQueue([...queue, data]);
      setInputLink("");
      toast.success("Song added to queue successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (id: string, isUpvote: boolean) => {
    setQueue(
      queue
        .map((video) =>
          video.id === id
            ? {
                ...video,
                upvotes: isUpvote ? video.upvotes + 1 : video.upvotes - 1,
                haveUpvoted: !video.haveUpvoted,
              }
            : video
        )
        .sort((a, b) => b.upvotes - a.upvotes)
    );

    (isUpvote ? upvoteStream(id) : downvoteStream(id)).catch(() => {});
  };

  const playNext = async () => {
    if (queue.length > 0) {
      try {
        setPlayNextLoader(true);
        const json = await nextStreamApi();
        setCurrentVideo(json.stream);
        setQueue((q) => q.filter((x) => x.id !== json.stream?.id));
      } catch (e) {
        console.error("Error playing next song:", e);
      } finally {
        setPlayNextLoader(false);
      }
    }
  };

  const handleShare = () => {
    const shareableLink = `${window.location.origin}/creator/${creatorId}`;
    navigator.clipboard.writeText(shareableLink).then(
      () => {
        toast.success("Link copied to clipboard!");
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast.error("Failed to copy link. Please try again.");
      }
    );
  };

  const emptyQueue = async () => {
    try {
      const data = await emptyQueueApi(creatorId);
      toast.success(data.message || "Queue emptied");
      refreshStreams();
      setIsEmptyQueueDialogOpen(false);
    } catch (error: any) {
      console.error("Error emptying queue:", error);
      toast.error(
        error?.message || "An error occurred while emptying the queue"
      );
    }
  };

  const removeSong = async (streamId: string) => {
    try {
      await removeStreamApi(streamId);
      toast.success("Song removed successfully");
      refreshStreams();
    } catch (error: any) {
      toast.error(
        error?.message || "An error occurred while removing the song"
      );
    }
  };

  const handleRedirectToAnalytics = () => {
    router.push(`/dashboard/${creatorId}/analytics`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[rgb(10,10,10)] text-gray-200">
      <Appbar />
      <div className="flex justify-center">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 w-screen max-w-screen-xl pt-8">
          <div className="col-span-3">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  Upcoming Songs
                </h2>
                <div className="space-x-2">
                  {/* Analytics Redirect BTN  */}
                  <Button
                    onClick={handleRedirectToAnalytics}
                    className="bg-purple-700 hover:bg-purple-800 text-white"
                  >
                    <Sparkles className="mr-2 w-4 h-4 " />
                    <span>Insights</span>
                  </Button>
                  {/* Share BTN  */}
                  <Button
                    onClick={handleShare}
                    className="bg-purple-700 hover:bg-purple-800 text-white"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  {/* Empty Queue BTN */}
                  {isCreator && (
                    <Button
                      onClick={() => setIsEmptyQueueDialogOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Empty Queue
                    </Button>
                  )}
                </div>
              </div>
              {queue.length === 0 && (
                <Card className="bg-gray-900 border-gray-800 w-full">
                  <CardContent className="p-4">
                    <p className="text-center py-8 text-gray-400">
                      No videos in queue
                    </p>
                  </CardContent>
                </Card>
              )}
              {queue.map((video) => (
                <Card key={video.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4 flex items-center space-x-4">
                    <img
                      src={video.smallImg}
                      alt={`Thumbnail for ${video.title}`}
                      className="w-30 h-20 object-cover rounded"
                    />
                    <div className="flex flex-col w-full">
                      <div className="flex flex-row">
                        <div className="flex-grow">
                          <h3 className="font-semibold text-white">
                            {video.title}
                          </h3>
                          <div className="flex items-end space-x-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleVote(video.id, !video.haveUpvoted)
                              }
                              className="flex items-center space-x-1 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                            >
                              {video.haveUpvoted ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronUp className="h-4 w-4" />
                              )}
                              <span>{video.upvotes}</span>
                            </Button>
                          </div>
                        </div>
                        {isCreator && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeSong(video.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs text-right h-[10%]">
                        Added by : {video?.addedBy?.email}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <div className="max-w-4xl mx-auto p-4 space-y-6 w-full">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">Add a song</h1>
              </div>
              <form onSubmit={handleSubmit} className="space-y-2">
                <Input
                  type="text"
                  placeholder="Paste YouTube link here"
                  value={inputLink}
                  onChange={(e) => setInputLink(e.target.value)}
                  className="bg-gray-900 text-white border-gray-700 placeholder-gray-500"
                />
                <Button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white"
                >
                  {loading ? "Loading..." : "Add to Queue"}
                </Button>
              </form>
              {inputLink && inputLink.match(YT_REGEX) && !loading && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4">
                    <LiteYouTubeEmbed title="" id={inputLink.split("?v=")[1]} />
                  </CardContent>
                </Card>
              )}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Now Playing</h2>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4">
                    {currentVideo ? (
                      <div>
                        {playVideo ? (
                          <div ref={videoPlayerRef} className="w-full" />
                        ) : (
                          <>
                            <img
                              src={currentVideo.bigImg}
                              className="w-full h-72 object-cover rounded"
                              alt={currentVideo.title}
                            />
                            <p className="mt-2 text-center font-semibold text-white">
                              {currentVideo.title}
                            </p>
                          </>
                        )}
                        <p className="mt-2 text-center text-sm text-gray-400">
                          Added By : {currentVideo?.addedBy?.email}
                        </p>
                      </div>
                    ) : (
                      <p className="text-center py-8 text-gray-400">
                        No video playing
                      </p>
                    )}
                  </CardContent>
                </Card>
                {playVideo && (
                  <Button
                    disabled={playNextLoader}
                    onClick={playNext}
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white"
                  >
                    <Play className="mr-2 h-4 w-4" />{" "}
                    {playNextLoader ? "Loading..." : "Play next"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Dialog
        open={isEmptyQueueDialogOpen}
        onOpenChange={setIsEmptyQueueDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Empty Queue</DialogTitle>
            <DialogDescription>
              Are you sure you want to empty the queue? This will remove all
              songs from the queue. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEmptyQueueDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={emptyQueue}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Empty Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
