#!/usr/bin/env python3
"""
Startup wrapper that patches dask before Rasa loads.

Rasa 3.6's dask graph runner wraps scipy sparse matrix results in dask Delayed
objects. Downstream code that accesses sparse-matrix attributes (.row, .col,
.data, .indices, .indptr) on those wrappers hits dask's __getattr__ guard and
gets AttributeError: Attribute {attr} not found. Patching __getattr__ to
compute the Delayed first fixes model loading.
"""
import sys


def _patch_dask():
    try:
        from dask.delayed import Delayed

        _orig = Delayed.__getattr__

        _SPARSE_ATTRS = frozenset({
            "row", "col", "data", "indices", "indptr",
            "shape", "dtype", "nnz", "format",
            "toarray", "tolist", "tocsr", "tocsc", "tocoo", "todense",
            "A", "A1", "T", "H", "real", "imag",
        })

        def _fixed_getattr(self, attr):
            if attr in _SPARSE_ATTRS:
                try:
                    return getattr(self.compute(), attr)
                except Exception:
                    pass
            return _orig(self, attr)

        Delayed.__getattr__ = _fixed_getattr
        print("[startup] dask Delayed.__getattr__ patched", flush=True)
    except Exception as exc:
        print(f"[startup] dask patch skipped: {exc}", flush=True)


_patch_dask()

from rasa.__main__ import main  # noqa: E402

sys.argv[0] = "rasa"
main()
