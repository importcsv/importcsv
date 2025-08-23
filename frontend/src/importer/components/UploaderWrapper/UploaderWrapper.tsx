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
      className={`w-full flex justify-center items-center flex-col bg-gray-50 border-2 border-dashed rounded-lg transition-all duration-200 hover:bg-gray-100 ${
        isMobile ? 'min-h-[220px] py-8 px-6' : 'min-h-[380px] py-12 px-10'
      } border-gray-300 hover:border-gray-400 [&.drag-active]:border-blue-500 [&.drag-active]:bg-blue-50`}
    >
      {/* Upload Icon */}
      <Box
        className={`mb-4 p-4 rounded-full bg-white transition-all duration-200 text-gray-400`}
      >
        <CloudUpload size={isMobile ? 32 : 48} />
      </Box>
      
      {loading ? (
        <Text className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-700`}>
          {t("Loading...")}
        </Text>
      ) : (
        <Text 
          className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-700`}
        >
          {t("Drop a file or click to browse")}
        </Text>
      )}
    </NativeDropzone>
  );
}
