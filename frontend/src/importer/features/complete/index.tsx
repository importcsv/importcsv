import { useTranslation } from "../../../i18n/useTranslation";
import { Button } from "../../components/ui/button";
import Box from "../../components/Box";
import { CompleteProps } from "./types";
import { RotateCcw, Check } from "lucide-react";
import { cn } from "../../../utils/cn";

export default function Complete({ reload, close, isModal }: CompleteProps) {
  const { t } = useTranslation();
  return (
    <Box className={cn(
      "max-w-[1000px] pt-4 h-full flex-1 shadow-none bg-transparent self-center",
      "flex items-center justify-center text-2xl flex-col gap-4 text-center relative"
    )}>
      <>
        <span className={cn(
          "w-16 h-16 relative isolate flex items-center justify-center",
          "before:content-[''] before:absolute before:inset-0 before:rounded-full",
          "before:bg-green-500 before:-z-10"
        )}>
          <Check className="w-6 h-6 text-white" />
        </span>
        <div>{t("Import Successful")}</div>
        <div className={cn(
          "flex gap-8 items-center justify-center mt-12",
          "[&>*]:flex-1 [&>*]:min-w-[190px]"
        )}>
          <Button type="button" variant="outline" onClick={reload}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("Upload another file")}
          </Button>
          {isModal && (
            <Button type="button" onClick={close}>
              <Check className="mr-2 h-4 w-4" />
              {t("Done")}
            </Button>
          )}
        </div>
      </>
    </Box>
  );
}
