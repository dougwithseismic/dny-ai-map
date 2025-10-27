import { toast } from "sonner";

/**
 * Hook to copy text to clipboard with toast notifications
 */
export function useCopyToClipboard() {
  const copyToClipboard = async (text: string, successMessage?: string) => {
    try {
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success(successMessage || "Copied to clipboard!");
        return true;
      }

      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      textArea.remove();

      if (successful) {
        toast.success(successMessage || "Copied to clipboard!");
        return true;
      } else {
        throw new Error("Copy command failed");
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
      return false;
    }
  };

  return { copyToClipboard };
}
