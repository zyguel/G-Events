export default function EventPageLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-72 rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-28 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-28 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
