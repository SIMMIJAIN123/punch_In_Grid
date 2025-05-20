// import { useState } from 'react';
// import axios from '../api/axiosConfig';

// export default function UploadExcel() {
//   const [file, setFile] = useState(null);

//   const handleUpload = async () => {
//     const formData = new FormData();
//     formData.append('file', file);
//     try {
//       await axios.post('/auth/upload_excel', formData);
//       alert('Excel uploaded');
//     } catch (err) {
//       alert(err.response?.data?.detail || 'Upload failed');
//     }
//   };

//   return (
//     <>
//       <h2>Upload Excel</h2>
//       <input type="file" onChange={e => setFile(e.target.files[0])} />
//       <button onClick={handleUpload}>Upload</button>
//     </>
//   );
// }