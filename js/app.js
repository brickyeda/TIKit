const app = Object.assign(
  {},
  appCore,
  appNotebooks,
  appTasks,
  appCalendar,
  appSettings,
  appDrawing,
  appCalculator
);

window.app = app;
