import time
import matplotlib.pyplot as plt

try:
    import ipywidgets as widgets
    from IPython.display import display, clear_output
except Exception as e:
    raise RuntimeError(
        "ipywidgets not available. Run this in Jupyter/JupyterLab with ipywidgets installed."
    ) from e


class TwoPointerVisualizer:
    """
    Visualizes the classic two-pointer technique to find a pair with a target sum
    in a sorted array.

    Rules:
      - If arr[l] + arr[r] < target => l++
      - If arr[l] + arr[r] > target => r--
      - If equal => found
    """

    def __init__(self, arr):
        self.arr = list(arr)
        if self.arr != sorted(self.arr):
            raise ValueError("Array must be sorted for this two-pointer demo.")

        # State
        self.l = 0
        self.r = len(self.arr) - 1
        self.target = 10
        self.done = False
        self.found = False
        self.message = ""

        # UI
        self.target_slider = widgets.IntSlider(
            value=self.target,
            min=min(self.arr) * 2,
            max=max(self.arr) * 2,
            step=1,
            description="Target",
            continuous_update=False
        )

        self.step_btn = widgets.Button(description="Step ▶", button_style="")
        self.play_btn = widgets.ToggleButton(description="Play ⏵", value=False, button_style="success")
        self.reset_btn = widgets.Button(description="Reset ⟲", button_style="warning")

        self.speed = widgets.FloatSlider(
            value=0.6, min=0.1, max=2.0, step=0.1,
            description="Speed (s)", continuous_update=False
        )

        self.out = widgets.Output()

        # Bind events
        self.target_slider.observe(self._on_target_change, names="value")
        self.step_btn.on_click(self._on_step)
        self.reset_btn.on_click(self._on_reset)
        self.play_btn.observe(self._on_play_toggle, names="value")

        # Initial draw
        self._draw()

    def show(self):
        controls = widgets.HBox([self.step_btn, self.play_btn, self.reset_btn])
        panel = widgets.VBox([self.target_slider, self.speed, controls, self.out])
        display(panel)

    def _on_target_change(self, change):
        self.target = int(change["new"])
        # Changing target shouldn't force reset, but it's usually clearer:
        self._reset_state(keep_target=True)
        self._draw()

    def _on_step(self, _):
        if not self.done:
            self._step()
        self._draw()

    def _on_reset(self, _):
        self._reset_state(keep_target=True)
        self._draw()

    def _on_play_toggle(self, change):
        if change["new"] is True:
            # Run loop until paused or done
            self._run_play_loop()

    def _run_play_loop(self):
        # IMPORTANT: this is a simple loop suitable for notebooks.
        # If you have very large arrays or want smoother animation, we can upgrade it.
        while self.play_btn.value and not self.done:
            self._step()
            self._draw()
            time.sleep(float(self.speed.value))

        # auto-stop when done
        if self.done:
            self.play_btn.value = False

    def _reset_state(self, keep_target=True):
        self.l = 0
        self.r = len(self.arr) - 1
        self.done = False
        self.found = False
        self.message = ""
        if not keep_target:
            self.target = 10
            self.target_slider.value = self.target

    def _step(self):
        if self.l >= self.r:
            self.done = True
            self.found = False
            self.message = "Stopped: pointers crossed (no pair found)."
            return

        s = self.arr[self.l] + self.arr[self.r]
        if s == self.target:
            self.done = True
            self.found = True
            self.message = f"✅ Found: arr[{self.l}]={self.arr[self.l]} + arr[{self.r}]={self.arr[self.r]} = {self.target}"
        elif s < self.target:
            self.message = f"Sum {s} < target {self.target} → move LEFT pointer (l++)"
            self.l += 1
        else:
            self.message = f"Sum {s} > target {self.target} → move RIGHT pointer (r--)"
            self.r -= 1

    def _draw(self):
        with self.out:
            clear_output(wait=True)

            # --- Plot ---
            fig, ax = plt.subplots(figsize=(10, 2.8))
            x = list(range(len(self.arr)))
            y = self.arr

            # Bars
            ax.bar(x, y)

            # Pointer highlights
            ax.scatter([self.l], [self.arr[self.l]], s=250, marker="v", label="L (left)")
            ax.scatter([self.r], [self.arr[self.r]], s=250, marker="v", label="R (right)")

            # Labels on bars
            for i, val in enumerate(self.arr):
                ax.text(i, val + (max(self.arr)*0.02), str(val), ha="center", va="bottom", fontsize=10)

            # Show current sum line/text
            if not self.done:
                s = self.arr[self.l] + self.arr[self.r]
                ax.set_title(f"Two Pointers: l={self.l}, r={self.r} | arr[l]+arr[r]={s} | target={self.target}")
            else:
                ax.set_title(f"Done | target={self.target}")

            ax.set_xticks(x)
            ax.set_xlabel("Index")
            ax.set_ylabel("Value")

            # Message box
            msg = self.message if self.message else "Click Step or Play to begin."
            ax.text(
                0.01, 0.95, msg,
                transform=ax.transAxes,
                ha="left", va="top",
                bbox=dict(boxstyle="round", alpha=0.15),
                fontsize=11
            )

            ax.legend(loc="upper right")
            plt.tight_layout()
            plt.show()


# ---- Try it ----
arr = [1, 2, 3, 4, 6, 7, 9, 11, 14]
viz = TwoPointerVisualizer(arr)
viz.show()