import { createCRUDServices } from './baseService';

export const createWidgetsService = (setWidgets, widgets, saveToStorage) => {
  const baseService = createCRUDServices(setWidgets, widgets, saveToStorage, 'happyhome_widgets');

  const getById = (id) => {
    return widgets.find(w => w.id === id);
  };

  const getByLocation = (location) => {
    return widgets.filter(w => w.location === location).sort((a, b) => a.order - b.order);
  };

  const toggleEnabled = (id) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget) return null;
    return baseService.update(id, { enabled: !widget.enabled });
  };

  const reorder = (location, orderedIds) => {
    const locationWidgets = widgets.filter(w => w.location === location);
    const otherWidgets = widgets.filter(w => w.location !== location);
    const reorderedWidgets = orderedIds.map((id, index) => {
      const widget = locationWidgets.find(w => w.id === id);
      return { ...widget, order: index };
    });
    const newWidgets = [...otherWidgets, ...reorderedWidgets];
    setWidgets(newWidgets);
    saveToStorage('happyhome_widgets', newWidgets);
    return true;
  };

  const create = (widget) => {
    const maxOrder = widgets.filter(w => w.location === widget.location).reduce((max, w) => Math.max(max, w.order), -1);
    const newWidget = {
      ...widget,
      id: Date.now(),
      order: maxOrder + 1,
      enabled: widget.enabled !== false,
      config: widget.config || {},
    };
    const newWidgets = [...widgets, newWidget];
    setWidgets(newWidgets);
    saveToStorage('happyhome_widgets', newWidgets);
    return newWidget;
  };

  return {
    ...baseService,
    getById,
    getByLocation,
    toggleEnabled,
    reorder,
    create,
  };
};

export default createWidgetsService;