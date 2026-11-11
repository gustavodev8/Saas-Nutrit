import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { ExerciseAutocomplete, type ExerciseCatalogSuggestion } from "./ExerciseAutocomplete";

const exercises: ExerciseCatalogSuggestion[] = [
  { id: 1, name: "Elevação pélvica", search_aliases: ["ponte de glúteo"] },
  { id: 2, name: "Supino reto", search_aliases: ["bench press"] },
];

function ControlledAutocomplete({ onSelect }: { onSelect: (item: ExerciseCatalogSuggestion) => void }) {
  const [value, setValue] = useState("");
  return <ExerciseAutocomplete id="exercise" value={value} items={exercises} onChange={setValue} onSelect={onSelect} />;
}

describe("ExerciseAutocomplete", () => {
  it("finds accented catalog names with an unaccented query and selects by click", () => {
    const onSelect = vi.fn();
    render(<ControlledAutocomplete onSelect={onSelect} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "elevacao pelvica" } });
    fireEvent.click(screen.getByRole("button", { name: /Elevação pélvica/i }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining(exercises[0]));
  });

  it("supports normalized alias search and keyboard selection", () => {
    const onSelect = vi.fn();
    render(<ControlledAutocomplete onSelect={onSelect} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "PONTE de gluteo" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining(exercises[0]));
  });
});
