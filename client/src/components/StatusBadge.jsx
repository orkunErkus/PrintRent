export default function StatusBadge({ isOnline }) {
  return (
    <span className={isOnline ? 'badge-online' : 'badge-offline'}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}
