export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type CartSnapshot = {
  items: CartItem[];
};
