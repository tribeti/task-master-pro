import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/useDebounce";

describe("useDebounce hook", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("nên trả về giá trị ban đầu ngay lập tức", () => {
    const { result } = renderHook(() => useDebounce("initial value"));

    expect(result.current).toBe("initial value");
  });

  it("nên cập nhật giá trị sau khoảng thời gian delay mặc định (500ms)", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "initial value" },
    });

    rerender({ value: "updated value" });

    expect(result.current).toBe("initial value");

    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current).toBe("initial value");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("updated value");
  });

  it("nên cập nhật giá trị theo custom delay truyền vào", () => {
    const customDelay = 1000;
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: customDelay } },
    );

    rerender({ value: 1, delay: customDelay });

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe(0);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe(1);
  });

  it("chỉ nên cập nhật một lần đối với giá trị cuối cùng nếu có nhiều thay đổi diễn ra liên tục", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: "A" } },
    );

    rerender({ value: "B" });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: "C" });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: "D" });

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe("A");

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe("D");
  });
});
