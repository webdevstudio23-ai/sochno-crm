import React from "react";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

/**
 * Ловит любые ошибки рендера в дереве React и показывает понятное сообщение
 * вместо «пустого бежевого экрана». Данные при этом не теряются — они уже
 * в локальной базе; достаточно нажать «Перезагрузить».
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // оставляем след в консоли DevTools для диагностики
    console.error("Перехвачена ошибка интерфейса:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="sc-errbound">
          <div className="sc-errbound-card">
            <h1>Что-то пошло не так</h1>
            <p>
              Произошла ошибка в интерфейсе. Ваши данные сохранены в локальной
              базе и не потеряны. Нажмите «Перезагрузить», чтобы продолжить работу.
            </p>
            <pre>{String(this.state.error?.message || this.state.error)}</pre>
            <button className="sc-btn" onClick={() => window.location.reload()}>
              Перезагрузить
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
