// Video3Popup.tsx
import { useEffect, useState } from "react";
import { Box, Typography, IconButton, List, ListItem } from "@mui/material";
import {
  ControlPoint,
  Delete,
  InfoOutline,
  PlayCircleOutline,
} from "@mui/icons-material";
import CustomButton from "../../CustomButton/CustomButton";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../context/AuthContext";
import { useSlide3 } from "../../../context/Slide3Context";
import toast from "react-hot-toast";
import { COLORS } from "../../../constant/color";
import { handleAutoDeletedVideo } from "../../../lib/lib";

interface Video3PopupProps {
  onClose: () => void;
  activeIndex?: number;
}

type UserVideo = {
  id: string;
  url: string;
  name: string;
  size?: string;
  duration?: string;
};

const toUserVideo = (video: any, index: number): UserVideo | null => {
  const url = typeof video === "string" ? video : video?.url;
  if (typeof url !== "string" || !url.trim()) return null;

  const id =
    typeof video?.id === "string" && video.id.trim()
      ? video.id
      : `video-${index}-${url}`;
  const fallbackName = url.split("/").pop()?.split("?")[0] || "Video";
  const name =
    typeof video?.name === "string" && video.name.trim()
      ? video.name
      : fallbackName;

  return {
    id,
    url,
    name,
    size: typeof video?.size === "string" ? video.size : undefined,
    duration: typeof video?.duration === "string" ? video.duration : undefined,
  };
};

const Video3Popup = ({ onClose }: Video3PopupProps) => {
  const {
    tips3,
    setTips3,
    upload3,
    setUpload3,
    video3,
    setVideo3,
    duration3,
    setDuration3,
    setSelectedVideoUrl3,
    selectedVideoUrl3,
    setQrPosition3,
  } = useSlide3();

  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDeleteMedia, setIsDeleteMedia] = useState('')


  const { user } = useAuth();
  const generateId = () => Date.now() + Math.random();

  // Handle multiple video files
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setFileError(null);

    const validFiles: any = Array.from(files).filter((file) => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 50) {
        setFileError(`Error: ${file.name.slice(0, 20)} is too large (max 50MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;
    setVideo3(validFiles); // store as an array
  };

  // Save video URL to the user's "video" array in DB
  const saveVideoUrlToDB = async (videoData: any) => {
    if (!user?.id) return;

    const { data: userData, error: fetchError } = await supabase
      .from("Users")
      .select("video")
      .eq("auth_id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching user data:", fetchError);
      return;
    }

    const updatedVideos = userData?.video
      ? [...userData.video, videoData]
      : [videoData];

    const { error: updateError } = await supabase
      .from("Users")
      .update({ video: updatedVideos })
      .eq("auth_id", user.id);

    if (updateError) {
      console.error("Error updating videos:", updateError);
      return;
    }
  };

  // Upload video to Supabase Storage


  const handleVideoUpload = async () => {
    if (!video3 || video3.length === 0) {
      alert("No video selected");
      return;
    }

    setLoading(true);

    try {
      for (const file of video3) {
        const videoId = generateId().toString();
        const fileExt = file.name.split(".").pop();
        const fileName = `${videoId}.${fileExt}`;
        const filePath = `video/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
            metadata: {
              user_id: user?.id,
              created_at: new Date().toISOString(),
            },
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: publicData } = supabase.storage
          .from("media")
          .getPublicUrl(filePath);
        const metadata = {
          id: videoId,
          url: publicData.publicUrl,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
          duration: Math.floor(duration3 ?? 0) + "s",
        };

        await saveVideoUrlToDB(metadata);

        // Update qrPosition with the new video URL
        setQrPosition3((prev) => ({
          ...prev,
          url: publicData.publicUrl,
          zIndex: 1000,
        }));

        toast.success("Your video uploaded successfully!");

        handleAutoDeletedVideo(user?.id, videoId, fileName, fetchUserVideos, 7 * 24 * 60 * 60 * 1000, setIsDeleteMedia);
      }

      await fetchUserVideos();
      setVideo3(null);
      setDuration3(0);
      setUpload3(true);
    } catch (err) {
      console.error("Error uploading videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoDelete = () => {
    setVideo3(null);
  };

  const [userVideos, setUserVideos] = useState<UserVideo[]>([]);

  // Fetch user videos
  const fetchUserVideos = async () => {
    if (!user?.id) return;
    console.log("Fetching videos for user:", user.id);

    const { data, error } = await supabase
      .from("Users")
      .select("video")
      .eq("auth_id", user.id)
      .single();

    console.log("Supabase fetch result:", { data, error });

    if (error) {
      console.error("Error fetching videos:", error);
      return;
    }

    if (Array.isArray(data?.video)) {
      const videos = data.video
        .map((item: any, index: number) => toUserVideo(item, index))
        .filter((item: UserVideo | null): item is UserVideo => Boolean(item));
      console.log("Fetched user videos:", videos);
      setUserVideos(videos);
    } else {
      console.log("No videos found for user.");
      setUserVideos([]);
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadVideos = async () => {
      try {
        await fetchUserVideos();
      } catch (err) {
        console.error("Error loading videos:", err);
      }
    };

    loadVideos();
  }, [user]);

  // Delete....
  const handleDeleteVideo = async (videoId: string) => {
    if (!user?.id) return;

    const { data: userData } = await supabase
      .from("Users")
      .select("video")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.video) return;

    const updated = userData.video.filter((v: any, index: number) => {
      const videoItem = toUserVideo(v, index);
      return videoItem?.id !== videoId;
    });

    const { error } = await supabase
      .from("Users")
      .update({ video: updated })
      .eq("auth_id", user.id);

    if (!error) {
      setUserVideos(
        updated
          .map((item: any, index: number) => toUserVideo(item, index))
          .filter((item: UserVideo | null): item is UserVideo => Boolean(item))
      );
      toast.success("Video deleted successfully");
    }
  };

  return (
    <PopupWrapper
      title="Video"
      onClose={onClose}
      sx={{
        width: { md: 300, sm: 300, xs: "95%" },
        height: { md: 600, sm: 600, xs: 450 },
        left: { md: "23%", sm: "0%", xs: 0 },
        mt: { md: 0, sm: 0, xs: 0 },
        overflowY: "hidden",
      }}
    >
      {tips3 && (
        <Box sx={{ height: "100%", overflow: "hidden" }}>
          {/* <Box
            sx={{
              height: 200,
              width: "100%",
              bgcolor: "gray",
              position: "relative",
              display: { md: 'flex', sm: 'flex', xs: 'none' }
            }}
          >
            <video
              src={TipsVideo}
              autoPlay
              loop
              muted
              style={{ width: "100%", height: "100%" }}
            />
          </Box> */}
          <Box p={2}>
            <Typography
              sx={{
                fontSize: "23px",
                fontWeight: "bold",
                color: "#363636ff",
                textAlign: "center",
              }}
            >
              Add a Free Video Message!
            </Typography>
            <List
              component="ol"
              sx={{
                listStyleType: "decimal",
                fontSize: "14px",
                color: "#444444ff",
                pl: 2,
                "& .MuiListItem-root": {
                  display: "list-item",
                  padding: "4px",
                  margin: 0,
                },
              }}
            >
              <ListItem>You upload a Video recording</ListItem>
              <ListItem>We print a QR in the card</ListItem>
              <ListItem>They scan it to play the message</ListItem>
            </List>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 3 }}
            >
              <CustomButton
                title="Add Video"
                width="100%"
                onClick={() => {
                  setTips3(false);
                  setUpload3(true);
                }}
              />
              <CustomButton
                title="Maybe Later"
                width="100%"
                variant="outlined"
                onClick={() => {
                  setTips3(false);
                  setUpload3(true);
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      {upload3 && (
        <Box>
          {!video3 && (
            <>
              <Box
                component="input"
                type="file"
                accept="video/*"
                sx={{
                  position: "absolute",
                  width: "260px",
                  height: "110px",
                  opacity: 0,
                  cursor: "pointer",
                  left: 20,
                  zIndex: 10,
                }}
                onChange={handleVideoFileChange}
                multiple
              />
              <Box
                sx={{
                  width: "100%",
                  height: "100px",
                  borderRadius: "8px",
                  border: "3px dashed #3a7bd5",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  userSelect: "none",
                  pointerEvents: "none",
                  color: "#3a7bd5",
                  fontWeight: "bold",
                  flexDirection: "column",
                  fontSize: "20px",
                }}
              >
                <ControlPoint fontSize="large" />
                Add Video
              </Box>

              {fileError && (
                <Typography
                  sx={{
                    color: "red",
                    fontSize: "13px",
                    mt: 1,
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  {fileError}
                </Typography>
              )}

              {userVideos.length > 0 && (
                <Box
                  mt={3}
                  sx={{
                    height: { md: '400px', sm: '450px', xs: "200px" },
                    overflowY: "auto",
                    p: 1,
                    "&::-webkit-scrollbar": {
                      height: "6px",
                      width: "5px",
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "#f1f1f1",
                      borderRadius: "20px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: COLORS.primary,
                      borderRadius: "20px",
                    },
                  }}
                >
                  {
                    isDeleteMedia ? <Typography
                      sx={{ fontSize: "14px", fontWeight: "bold", mb: 1, color: 'red', opacity: 0.5 }}
                    >Your videos are deleted after one week</Typography> : <Box sx={{ mb: 1 }}>
                      <Typography sx={{ fontSize: "16px", fontWeight: "bold" }}>
                        Your Uploaded Videos:
                      </Typography>
                      <Box component="hr" sx={{ border: 0, borderTop: "1px solid #e0e0e0", my: 1 }} />
                      <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                        Double tap your video to load your qr code onto your card
                      </Typography>
                    </Box>
                  }
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    {userVideos.map((v: UserVideo) => (
                      <Box
                        key={v.id}
                        onClick={() =>
                          setSelectedVideoUrl3((prev) => (prev === v.url ? null : v.url))
                        }
                        sx={{
                          position: "relative",
                          border:
                            selectedVideoUrl3 === v.url
                              ? `3px solid ${COLORS.primary}`
                              : `1px solid ${COLORS.gray}`,
                          borderRadius: 2,
                          overflow: "hidden",
                          width: "100%",
                          cursor: "pointer",
                          opacity: selectedVideoUrl3 === v.url ? 1 : 0.9,
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            opacity: 1,
                          },
                          p: 1,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {/* Video Info */}
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 600, color: "#333" }}>
                            {(v.name || "Video").slice(0, 15)}
                          </Typography>
                          <Typography sx={{ fontSize: "13px", color: "#777" }}>
                            Duration: {v.duration || "-"} &nbsp; | &nbsp; Size: {v.size || "-"}
                          </Typography>
                        </Box>

                        {/* Delete Button */}
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVideo(v.id);
                          }}
                          sx={{
                            bgcolor: "#efefefff",
                            border: '1px solid gray',
                            "&:hover": { bgcolor: "#f3f0f0ff", color: "red" },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}

          {video3 && (
            <Box sx={{ width: "100%", height: { md: "500px", sm: "200px", xs: 300 }, position: "relative", overflowY: 'auto' }}>
              <Box
                component={'video'}
                src={URL.createObjectURL(video3[0])}
                controls
                autoPlay={false}
                onLoadedMetadata={(e) => setDuration3(e.currentTarget.duration)}
                sx={{
                  width: "100%",
                  height: { md: 200, sm: "200px", xs: 150 },
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <IconButton
                onClick={handleVideoDelete}
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: "#f0f1f3",
                  "&:hover": { bgcolor: "#f0f1f3", color: "#fd1ecdff" },
                  zIndex: 99,
                }}
                size="small"
                aria-label="Delete uploaded video"
              >
                {/* Delete icon SVG or MUI icon */}
                <Delete />
              </IconButton>

              <Box
                sx={{
                  display: "flex",
                  gap: 4,
                  mt: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{ display: "flex", alignItems: "center", gap: "3px" }}
                >
                  <InfoOutline /> {(video3[0].size / (1024 * 1024)).toFixed(0)}{" "}
                  MB
                </Typography>
                <Typography
                  sx={{ display: "flex", alignItems: "center", gap: "3px" }}
                >
                  <PlayCircleOutline /> {Math.floor(duration3 ?? 0)}s
                </Typography>
              </Box>

              <Box
                sx={{
                  p: { xl: 3, lg: 3, md: 3, sm: 3, xs: 1 },
                  mt: { xl: 1, lg: 1, md: 1, sm: 1, xs: 0 },
                  borderTop: "1px solid #d3d3d3ff",
                  borderBottom: "1px solid #d3d3d3ff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <input
                  type="checkbox"
                  style={{ width: 80, height: 80, cursor: "pointer" }}
                />
                <Typography sx={{ fontSize: "15px", color: "#929292ff" }}>
                  I confirm this video does not violate DIY Personalisation
                  content rule as outlined in{" "}
                  <Box
                    component="a"
                    href="#"
                    sx={{
                      textDecoration: "none",
                      color: "#3a7bd5",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    IDEA term and condition
                  </Box>
                </Typography>
              </Box>
              <br />
              <CustomButton
                title="Upload Video"
                width="90%"
                loading={loading}
                onClick={handleVideoUpload}
              />
            </Box>
          )}
        </Box>
      )}
    </PopupWrapper>
  );
};

export default Video3Popup;
