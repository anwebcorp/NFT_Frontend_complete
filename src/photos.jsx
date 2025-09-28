import { useState, useEffect } from "react";
import axios from "axios";

export default function Photos() {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("https://boringapi.com/api/v1/photos")
      .then(response => {
        console.log("Fetched Photos:", response.data);
        setPhotos(response.data.photos); // Extracting the 'photos' array correctly
      })
      .catch(err => {
        console.error("Error fetching photos:", err);
        setError("Failed to load photos.");
      });
  }, []);

  return (
    <div className="p-6 bg-gray-900 text-gray-300 min-h-screen flex justify-center items-center">
      <div className="max-w-3xl w-full">
        <h2 className="text-3xl font-semibold text-center border-b border-gray-700 pb-3">
          Photo Gallery
        </h2>

        {error ? (
          <p className="text-red-500 text-center mt-4">{error}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-4">
            {photos.map(photo => (
              <div key={photo.id} className="bg-gray-800 p-4 rounded-lg shadow-md transition hover:scale-105">
                <img src={photo.url} alt={photo.title} className="rounded-md w-full h-40 object-cover" />
                <p className="text-sm mt-2 text-gray-400 text-center">{photo.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
