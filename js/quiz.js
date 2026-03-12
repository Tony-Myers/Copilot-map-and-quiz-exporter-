function renderQuiz() {
  const container = document.getElementById("quizContainer");
  container.innerHTML = "";

  if (!studyPayload.quiz.questions.length) {
    const p = document.createElement("p");
    p.className = "small-note";
    p.textContent = "No quiz questions yet.";
    container.appendChild(p);
    return;
  }

  studyPayload.quiz.questions.forEach((question, questionIndex) => {
    const card = document.createElement("div");
    card.className = "question-card";

    const header = document.createElement("div");
    header.className = "question-header";
    header.innerHTML = `
      <div class="question-title">Question ${questionIndex + 1}</div>
      <div class="button-row">
        <button data-action="duplicate-question" data-index="${questionIndex}">Duplicate</button>
        <button class="delete-btn" data-action="delete-question" data-index="${questionIndex}">Delete</button>
      </div>
    `;

    const fields = document.createElement("div");
    fields.className = "question-fields";

    const questionField = buildTextareaField(
      `Question text`,
      question.question,
      (value) => {
        studyPayload.quiz.questions[questionIndex].question = value;
        updatePayloadPreview();
      },
      3
    );

    fields.appendChild(questionField);

    question.options.forEach((option, optionIndex) => {
      const row = document.createElement("div");
      row.className = "option-row";

      const radioWrap = document.createElement("div");
      radioWrap.className = "option-radio";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `correct_${questionIndex}`;
      radio.checked = question.correct_index === optionIndex;
      radio.addEventListener("change", () => {
        studyPayload.quiz.questions[questionIndex].correct_index = optionIndex;
        updatePayloadPreview();
      });

      radioWrap.appendChild(radio);

      const optionInput = document.createElement("input");
      optionInput.type = "text";
      optionInput.value = option;
      optionInput.placeholder = `Option ${optionIndex + 1}`;
      optionInput.addEventListener("input", (e) => {
        studyPayload.quiz.questions[questionIndex].options[optionIndex] = e.target.value;
        updatePayloadPreview();
      });

      row.appendChild(radioWrap);
      row.appendChild(optionInput);
      fields.appendChild(row);
    });

    const explanationField = buildTextareaField(
      `Explanation`,
      question.explanation,
      (value) => {
        studyPayload.quiz.questions[questionIndex].explanation = value;
        updatePayloadPreview();
      },
      3
    );

    const sourceRefField = buildInputField(
      `Source reference`,
      question.source_ref,
      (value) => {
        studyPayload.quiz.questions[questionIndex].source_ref = value;
        updatePayloadPreview();
      }
    );

    fields.appendChild(explanationField);
    fields.appendChild(sourceRefField);

    card.appendChild(header);
    card.appendChild(fields);
    container.appendChild(card);
  });

  bindQuizCardActions();
}

function bindQuizCardActions() {
  document.querySelectorAll('[data-action="delete-question"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      studyPayload.quiz.questions.splice(index, 1);
      renderQuiz();
      updatePayloadPreview();
    });
  });

  document.querySelectorAll('[data-action="duplicate-question"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      const clone = JSON.parse(JSON.stringify(studyPayload.quiz.questions[index]));
      studyPayload.quiz.questions.splice(index + 1, 0, clone);
      renderQuiz();
      updatePayloadPreview();
    });
  });
}

function buildTextareaField(labelText, value, onInput, rows = 2) {
  const wrapper = document.createElement("div");

  const label = document.createElement("label");
  label.className = "label";
  label.textContent = labelText;

  const textarea = document.createElement("textarea");
  textarea.rows = rows;
  textarea.value = value || "";
  textarea.addEventListener("input", (e) => onInput(e.target.value));

  wrapper.appendChild(label);
  wrapper.appendChild(textarea);
  return wrapper;
}

function buildInputField(labelText, value, onInput) {
  const wrapper = document.createElement("div");

  const label = document.createElement("label");
  label.className = "label";
  label.textContent = labelText;

  const input = document.createElement("input");
  input.type = "text";
  input.value = value || "";
  input.addEventListener("input", (e) => onInput(e.target.value));

  wrapper.appendChild(label);
  wrapper.appendChild(input);
  return wrapper;
}
