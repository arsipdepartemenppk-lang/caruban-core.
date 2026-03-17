import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Terjadi kesalahan yang tidak terduga.";
      let isPermissionError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error?.includes('insufficient permissions') || parsed.error?.includes('permission-denied')) {
            isPermissionError = true;
            errorMessage = `Akses Ditolak: Anda tidak memiliki izin untuk melakukan operasi ${parsed.operationType} pada ${parsed.path}.`;
          }
        }
      } catch (e) {
        // Not a JSON error
        if (this.state.error?.message.includes('permissions')) {
          isPermissionError = true;
          errorMessage = "Akses Ditolak: Izin tidak mencukupi.";
        }
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-[40px] p-10 text-center shadow-2xl">
            <div className={`w-20 h-20 mx-auto mb-8 rounded-3xl flex items-center justify-center border ${
              isPermissionError ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
              {isPermissionError ? <ShieldAlert size={40} /> : <AlertCircle size={40} />}
            </div>
            
            <h2 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase">
              {isPermissionError ? 'Izin Ditolak' : 'Ups! Ada Masalah'}
            </h2>
            
            <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-10">
              {errorMessage}
            </p>

            <button
              onClick={this.handleReset}
              className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              <RefreshCcw size={18} />
              MUAT ULANG HALAMAN
            </button>
            
            <p className="mt-6 text-[10px] text-zinc-700 font-black uppercase tracking-widest">
              ID Kesalahan: {Math.random().toString(36).substring(7).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

