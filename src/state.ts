
/**
 * Item for todo list
 */
export type Todo = {
  id: string;
  title: string;
  done: boolean;
};

export type TodoFilter = "all" | "active" | "done";

/** ---- Define global state shape ---- */
export interface AppState {
  counter: number;
  todos: readonly Todo[];
  filter: TodoFilter;

  settings: {
    theme: "light" | "dark";
    notificationsEnabled: boolean;
  }
}

/** ---- Initial state ---- */
export const initialState: AppState = {
  counter: 0,
  todos: [],
  filter: "all",
  settings: {
    theme: "light",
    notificationsEnabled: true,
  },
};
