type ProductsErrorStateProps = {
  onRetry: () => void;
};

export function ProductsErrorState({ onRetry }: ProductsErrorStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-black text-red-500">
        !
      </div>
      <h2 className="mt-4 text-xl font-bold text-red-500">
        상품을 불러올 수 없습니다
      </h2>
      <p className="mt-2 text-sm font-medium text-slate-500">
        서버 연결 상태를 확인한 뒤 다시 시도해주세요
      </p>
      <button
        type="button"
        className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-indigo-700"
        onClick={onRetry}
      >
        다시 시도
      </button>
    </div>
  );
}
