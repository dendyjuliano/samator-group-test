import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusChangeMenu } from "@/components/StatusChangeMenu";
import { Cylinder } from "@/lib/types";

function makeCylinder(overrides: Partial<Cylinder>): Cylinder {
  return {
    id: 1,
    serialNumber: "CYL-100001",
    gasType: "Oxygen",
    status: "Empty",
    customerName: null,
    lastUpdated: new Date().toISOString(),
    ...overrides,
  };
}

describe("StatusChangeMenu", () => {
  it("only offers statuses that are valid next transitions", async () => {
    const user = userEvent.setup();

    render(
      <StatusChangeMenu
        cylinder={makeCylinder({ status: "Empty" })}
        submitting={false}
        onChangeStatus={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /change status for/i }));

    const menuItems = screen.getAllByRole("button").map((b) => b.textContent);
    expect(menuItems).toEqual(expect.arrayContaining(["Filled", "InMaintenance", "Retired"]));
    expect(menuItems).not.toContain("Delivered");
  });

  it("shows no transitions available for a Retired cylinder", () => {
    render(
      <StatusChangeMenu
        cylinder={makeCylinder({ status: "Retired" })}
        submitting={false}
        onChangeStatus={jest.fn()}
      />
    );

    expect(screen.getByText(/no further transitions/i)).toBeInTheDocument();
  });

  it("requires a customer name before confirming a transition to Delivered", async () => {
    const user = userEvent.setup();
    const onChangeStatus = jest.fn();

    render(
      <StatusChangeMenu
        cylinder={makeCylinder({ status: "Filled" })}
        submitting={false}
        onChangeStatus={onChangeStatus}
      />
    );

    await user.click(screen.getByRole("button", { name: /change status for/i }));
    await user.click(screen.getByRole("button", { name: "Delivered" }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(
      await screen.findByText(/customer name is required/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/customer name/i), "PT Sinar O'Brien Medika");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /change status/i }));

    expect(onChangeStatus).toHaveBeenCalledWith("Delivered", "PT Sinar O'Brien Medika");
  });
});
