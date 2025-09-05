// Реализуй класс EventManager. Он должен быть singleton-класс, который принимает, обрабатывает и запускает события. Все возможные названия событий описаны в типе `EventNames`. Для каждого события в EventMapping необходимо указан соответствующий тип EventArgs. Предусмотри подходящий формат TypeScript для этого. AI!


export class EventManager {





}

export class EventArgs {   
}

export const EventMapping: { [key in string]: typeof EventArgs } = {
    'app:start': EventArgs,
}

export type EventNames = keyof typeof EventMapping;