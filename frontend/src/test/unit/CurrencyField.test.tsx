import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CurrencyField from "../../components/CurrencyField";

// Default language is "en" from test setup (i18n import)

describe("CurrencyField", () => {
  it("renders with formatted value", () => {
    render(<CurrencyField label="Amount" value="1000.50" onChange={vi.fn()} />);
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    expect(input.value).toBe("1,000.50");
  });

  it("formats on blur", () => {
    const onChange = vi.fn();
    render(<CurrencyField label="Amount" value="" onChange={onChange} />);
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "5894.49" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("5894.49");
    expect(input.value).toBe("5,894.49");
  });

  it("handles empty value on blur", () => {
    const onChange = vi.fn();
    render(<CurrencyField label="Amount" value="" onChange={onChange} />);
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("strips commas for en-US input on blur", () => {
    const onChange = vi.fn();
    render(<CurrencyField label="Amount" value="" onChange={onChange} />);
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1,000.50" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("1000.50");
  });

  it("supports custom decimal places", () => {
    render(<CurrencyField label="Rate" value="5.2834" onChange={vi.fn()} decimalPlaces={4} />);
    const input = screen.getByLabelText("Rate") as HTMLInputElement;
    expect(input.value).toBe("5.2834");
  });

  it("handles invalid input gracefully", () => {
    const onChange = vi.fn();
    render(<CurrencyField label="Amount" value="" onChange={onChange} />);
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("abc");
  });

  it("shows required and error props", () => {
    render(<CurrencyField label="Amount" value="" onChange={vi.fn()} required error />);
    const input = screen.getByLabelText("Amount *");
    expect(input).toBeInTheDocument();
  });

  it("updates display when value prop changes", () => {
    const { rerender } = render(<CurrencyField label="Amount" value="100" onChange={vi.fn()} />);
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    expect(input.value).toBe("100.00");
    rerender(<CurrencyField label="Amount" value="200" onChange={vi.fn()} />);
    expect(input.value).toBe("200.00");
  });
});
