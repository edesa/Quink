/**
 * This will wrap the optimised file and allow Quink to be used from both an AMD app and globally.
 */
(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD.
    define([], factory);
  }
}(this, function() {
