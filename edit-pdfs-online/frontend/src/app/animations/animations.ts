import { trigger, state, style, transition, animate } from '@angular/animations';


export const SlideInOutNavBarAnimation =
    trigger('slideInOut', [
        state('in', style({
            transform: 'translateX(-2%)',
            opacity: 1
        })),
        state('out', style({
            transform: 'translateX(-98%)',
            opacity: 1
        })),
        transition('out => in', [
            animate('300ms ease-in')
        ]),
        transition('in => out', [
            animate('300ms ease-out')
        ])
    ])

export const SlideInOutNavBarBtnAnimation = trigger('slideInOutBtn', [
    state('in', style({
        transform: 'translateX(0%)',
        opacity: 1
    })),
    state('out', style({
        transform: 'translateX(-50%)',
        opacity: 1
    })),
    transition('out => in', [
        animate('300ms ease-in')
    ]),
    transition('in => out', [
        animate('300ms ease-out')
    ])
])


export const SlideInOutToolbarExtension =
    trigger('genieGrow', [
        state('hidden', style({
            transform: 'scale(0)',
            opacity: 0
        })),

        state('visible', style({
            transform: 'scale(1)',
            opacity: 1
        })),

        transition('hidden => visible', [
            animate('400ms ease-out')
        ]),
        transition('visible => hidden', [
            animate('400ms cubic-bezier(0.42, 0, 1, 1)')
        ])
    ])

