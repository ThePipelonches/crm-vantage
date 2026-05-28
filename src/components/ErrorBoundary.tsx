import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="h-screen w-full bg-black text-red-500 flex flex-col items-center justify-center p-8 font-mono text-sm">
          <h1 className="text-2xl font-bold mb-4 text-white">💥 ERROR CRÍTICO DETECTADO</h1>
          <div className="bg-zinc-900 border border-red-900 p-6 rounded max-w-2xl w-full overflow-auto">
            <p className="mb-2 text-white font-bold">Mensaje:</p>
            <p className="mb-4 text-red-400">{this.state.error.message}</p>
            
            <p className="mb-2 text-white font-bold">Stack Trace:</p>
            <pre className="whitespace-pre-wrap text-xs text-zinc-400 bg-black p-4 rounded border border-zinc-800">
              {this.state.error.stack}
            </pre>
          </div>
          <p className="mt-6 text-zinc-500">Revisa la consola para más detalles o recarga la página.</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white text-black rounded hover:bg-zinc-200">
            Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}