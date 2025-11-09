export default function PageLoader({ text = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50">
      <div className="text-center">
        <div className="w-12 h-12 animate-spin rounded-full border-4 border-gray-300 border-t-[#5B50E8] mx-auto mb-4"></div>
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  );
}
