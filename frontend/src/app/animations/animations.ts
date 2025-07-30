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

export const SlideInOutNavBarBtnAnimation = trigger('slideInOutBtn',  [
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
trigger('slideInOut', [
    state('in', style({
    transform: 'translateY(150%)',
    opacity: 1,
    })),
    state('out', style({
    transform: 'translateY(-35%)',
    opacity: 0
    })),
    transition('out => in', [
    animate('300ms ease-in')
    ]),
    transition('in => out', [
    animate('300ms ease-out')
    ])
])
