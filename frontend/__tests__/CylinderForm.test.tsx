import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CylinderForm } from "@/components/CylinderForm";

describe("CylinderForm", () => {
  it("shows a validation error for a malformed serial number and does not open the confirm dialog", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<CylinderForm mode="create" submitting={false} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/serial number/i), "CYL-123");
    await user.click(screen.getByRole("button", { name: /create cylinder/i }));

    expect(
      await screen.findByText(/serial number must match the format cyl-xxxxxx/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("opens a confirmation dialog with valid values and calls onSubmit only after confirming", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<CylinderForm mode="create" submitting={false} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/serial number/i), "cyl-123456");
    await user.selectOptions(screen.getByLabelText(/gas type/i), "Nitrogen");
    await user.click(screen.getByRole("button", { name: /create cylinder/i }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(/create this cylinder/i);
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      serialNumber: "cyl-123456",
      gasType: "Nitrogen",
    });
  });
});
