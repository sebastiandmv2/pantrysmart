// src/services/userLists.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@user_lists";

// ID simple
const generateId = () =>
  Date.now().toString() + "-" + Math.random().toString(16).slice(2);

/**
 * Obtiene todas las listas. Si no hay nada, crea "Mi Lista" base.
 */
export async function getLists() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);

    if (!data) {
      const base = [{ id: "base", name: "Mi Lista", items: [] }];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(base));
      return base;
    }

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const base = [{ id: "base", name: "Mi Lista", items: [] }];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(base));
      return base;
    }

    return parsed;
  } catch (error) {
    console.log("Error reading user lists", error);
    return [{ id: "base", name: "Mi Lista", items: [] }];
  }
}

/**
 * Guarda el arreglo completo de listas.
 */
export async function saveLists(lists) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists || []));
  } catch (error) {
    console.log("Error saving user lists", error);
  }
}

/**
 * Devuelve una lista por ID.
 */
export async function getListById(listId) {
  const lists = await getLists();
  return lists.find((l) => l.id === listId) || null;
}

/**
 * Crea una lista nueva.
 */
export async function createList(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const lists = await getLists();

  const newList = {
    id: generateId(),
    name: trimmed,
    items: [],
  };

  const updated = [...lists, newList];
  await saveLists(updated);
  return newList;
}

/**
 * Elimina una lista (excepto la base).
 */
export async function deleteListById(listId) {
  const lists = await getLists();

  if (listId === "base") {
    return lists;
  }

  const updated = lists.filter((l) => l.id !== listId);
  await saveLists(updated);
  return updated;
}

/**
 * Agrega items a una lista.
 * itemsToAdd: [{ name, quantity, unit, fromRecipeId, fromRecipeName, ... }]
 */
export async function addItemsToList(listId, itemsToAdd = []) {
  if (!itemsToAdd.length) return null;

  const lists = await getLists();

  const updated = lists.map((list) => {
    if (list.id !== listId) return list;

    const currentItems = Array.isArray(list.items) ? list.items : [];

    const normalized = itemsToAdd.map((item) => ({
      id: item.id || generateId(),
      name: item.name?.trim() || "Producto",
      done: false,
      ...item,
    }));

    return {
      ...list,
      items: [...currentItems, ...normalized],
    };
  });

  await saveLists(updated);

  return updated.find((l) => l.id === listId) || null;
}
