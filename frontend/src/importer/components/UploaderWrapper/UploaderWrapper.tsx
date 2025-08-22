import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
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

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    noClick: true,
    noKeyboard: true,
    maxFiles: 1,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    onDropRejected: (fileRejections) => {
      setLoading(false);
      const errorMessage = fileRejections[0].errors[0].message;
      setDataError(errorMessage);
    },
    onDropAccepted: async ([file]) => {
      setLoading(true);
      onSuccess(file);
      setLoading(false);
    },
  });

  return (
    <Box
      {...getRootProps()}
      className={`w-full flex justify-center items-center flex-col bg-gray-50 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-100 ${
        isMobile ? 'min-h-[220px] py-8 px-6' : 'min-h-[380px] py-12 px-10'
      } ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      style={{
        minHeight: isMobile ? '220px' : '380px',
        padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem'
      }}
      onClick={open}
    >
      <input {...getInputProps()} />
      
      {/* Upload Icon */}
      <Box
        className={`mb-4 p-4 rounded-full bg-white transition-all duration-200 ${
          isDragActive ? 'text-blue-600 shadow-md' : 'text-gray-400'
        }`}
      >
        <CloudUpload size={isMobile ? 32 : 48} />
      </Box>
      
      {isDragActive ? (
        <Text className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-700`}>
          {t("Drop your file here")}
        </Text>
      ) : loading ? (
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
    </Box>
  );
}