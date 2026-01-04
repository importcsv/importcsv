import { useState, useEffect } from "preact/hooks";
import NativeDropzone from "./NativeDropzone";
import { useTranslation } from "../../../i18n/useTranslation";
import { Box, Text } from "../ui/flex";
import { UploaderWrapperProps } from "./types";
import { CloudUpload } from "lucide-react";

export default function UploaderWrapper({ onSuccess, setDataError, ...props }: UploaderWrapperProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    onSuccess(file);
    setLoading(false);
  };

  const acceptedTypes = {
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "text/csv": [".csv"],
  };

  return (
    <NativeDropzone
      onFileSelect={handleFileSelect}
      accept={acceptedTypes}
      disabled={loading}
      loading={loading}
      className={`
        group
        w-full flex justify-center items-center flex-col
        bg-gradient-to-b from-slate-50 to-slate-100
        dark:from-[#1a1a1a] dark:to-[#121212]
        border-2 rounded-xl
        transition-all duration-300 ease-out
        hover:shadow-lg hover:shadow-blue-500/10
        hover:border-blue-400 hover:from-blue-50 hover:to-slate-50
        dark:hover:from-blue-950/20 dark:hover:to-[#1a1a1a]
        [&.drag-active]:border-blue-500
        [&.drag-active]:bg-gradient-to-b [&.drag-active]:from-blue-50 [&.drag-active]:to-blue-100
        dark:[&.drag-active]:from-blue-950/30 dark:[&.drag-active]:to-blue-900/20
        [&.drag-active]:shadow-xl [&.drag-active]:shadow-blue-500/20
        [&.drag-active]:scale-[1.02]
        ${isMobile ? 'min-h-[220px] py-8 px-6' : 'min-h-[380px] py-12 px-10'}
        border-slate-200 dark:border-[#3a3a3a]
      `}
    >
      {/* Animated Icon Container */}
      <Box
        className={`
          mb-6 p-5 rounded-2xl
          bg-white dark:bg-[#242424] shadow-sm dark:shadow-none
          border border-slate-200 dark:border-[#3a3a3a]
          transition-all duration-300 ease-out
          group-hover:shadow-md group-hover:scale-110 group-hover:border-blue-200 dark:group-hover:border-blue-800
          [.drag-active_&]:scale-125 [.drag-active_&]:shadow-lg [.drag-active_&]:bg-blue-500
        `}
      >
        <CloudUpload
          size={isMobile ? 36 : 52}
          className="text-slate-400 dark:text-[#6b6b6b] transition-colors duration-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 [.drag-active_&]:text-white"
          strokeWidth={1.5}
        />
      </Box>

      {loading ? (
        <Text className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-slate-700 dark:text-[#a1a1a1]`}>
          {t("Loading...")}
        </Text>
      ) : (
        <>
          <Text
            className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-slate-800 dark:text-white mb-2 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400`}
          >
            {t("Drop a file or click to browse")}
          </Text>
          <Text className="text-sm text-slate-500 dark:text-[#6b6b6b]">
            {t("CSV, XLS, or XLSX up to 50MB")}
          </Text>
        </>
      )}
    </NativeDropzone>
  );
}
