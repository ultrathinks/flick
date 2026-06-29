type ProductsAlertProps = {
  message: string;
};

export function ProductsAlert({ message }: ProductsAlertProps) {
  return (
    <div className="fixed left-0 right-0 top-20 z-50 flex justify-center">
      <div className="flex max-w-md items-center rounded-xl bg-white px-5 py-4 shadow-md">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-sm font-black text-red-500">
          !
        </div>
        <span className="ml-3 text-base font-medium text-slate-900">
          {message}
        </span>
      </div>
    </div>
  );
}
