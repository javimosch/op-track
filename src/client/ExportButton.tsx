import axios from "axios";

interface ExportFeatureProps {
  filters: any;
  buttonText: string;
}

const ExportFeature: React.FC<ExportFeatureProps> = ({ filters, buttonText }) => {
  const handleExport = async () => {
    try {
      const response = await axios.get("/api/metrics/export", {
        params: filters,
        responseType: "blob", // Set response type to blob for file download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "metrics.csv"); // Set the file name
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting metrics:", error);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="bg-blue-500 text-white p-2 rounded mb-2 mt-2"
    >
      {buttonText}
    </button>
  );
};

export default ExportFeature;
