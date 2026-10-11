// xử lý logic nút checkbox
document.addEventListener("DOMContentLoaded", () => {
  const checkBoxMulti = document.querySelector("[checkbox-multi]");

  if (!checkBoxMulti) return;

  const inputCheckAll = checkBoxMulti.querySelector(
    "input[name='checkall']"
  );

  const inputCheckbox = checkBoxMulti.querySelectorAll(
    "input[name='id']"
  );

  if (!inputCheckAll) return;

  inputCheckAll.addEventListener("change", () => {
    inputCheckbox.forEach((checkbox) => {
      checkbox.checked = inputCheckAll.checked;
    });
  });

  inputCheckbox.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const countChecked = checkBoxMulti.querySelectorAll(
        "input[name='id']:checked"
      ).length;

      inputCheckAll.checked =
        inputCheckbox.length > 0 &&
        countChecked === inputCheckbox.length;
    });
  });
});