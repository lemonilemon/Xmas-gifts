/*
 * jQuery jSlots Plugin
 * http://matthewlein.com/jslot/
 * Copyright (c) 2011 Matthew Lein
 * Version: 1.0.2 (7/26/2012)
 * Dual licensed under the MIT and GPL licenses
 * Requires: jQuery v1.4.1 or later
 */

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
var head = document.getElementsByTagName('head')[0];
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = "http://code.jquery.com/jquery-2.2.1.min.js";

// Then bind the event to the callback function.
// There are several events for cross browser compatibility.
//script.onreadystatechange = handler;
script.onload = handler;

// Fire the loading
head.appendChild(script);

function handler(){
    console.log('jquery added :)');
}


(function($){

    $.jSlots = function(el, options){

        var base = this;

        base.$el = $(el);
        base.el = el;

        base.$el.data("jSlots", base);

        base.init = function() {

            base.options = $.extend({},$.jSlots.defaultOptions, options);

            base.setup();
            base.bindEvents();

        };


        // --------------------------------------------------------------------- //
        // DEFAULT OPTIONS
        // --------------------------------------------------------------------- //

        $.jSlots.defaultOptions = {
            minval : 1,
            maxval : 999,
            spincnt : 0,
            spinturn : 0,
            number : 3,          // Number: number of slots
            winnerNumber : 1,    // Number or Array: list item number(s) upon which to trigger a win, 1-based index, NOT ZERO-BASED
            spinner : '',        // CSS Selector: element to bind the start event to
            spinEvent : 'click', // String: event to start slots on this event
            onStart : $.noop,    // Function: runs on spin start,
            onEnd : $.noop,      // Function: run on spin end. It is passed (finalNumbers:Array). finalNumbers gives the index of the li each slot stopped on in order.
            onWin : $.noop,      // Function: run on winning number. It is passed (winCount:Number, winners:Array)
            easing : 'swing',    // String: easing type for final spin
            time : 7000,         // Number: total time of spin animation
            loops : 6            // Number: times it will spin during the animation
        };

        // --------------------------------------------------------------------- //
        // HELPERS
        // --------------------------------------------------------------------- //

        base.randomRange = function(low, high) {
            return Math.floor( Math.random() * (1 + high - low) ) + low;
        };

        // --------------------------------------------------------------------- //
        // VARS
        // --------------------------------------------------------------------- //

        base.isSpinning = false;
        base.spinSpeed = 0;
        base.winCount = 0;
        base.doneCount = 0;

        base.$liHeight = 0;
        base.$liWidth = 0;

        base.winners = [];
        base.allSlots = [];
        base.order = [];

        // --------------------------------------------------------------------- //
        // FUNCTIONS
        // --------------------------------------------------------------------- //


        base.setup = function() {

            // set sizes

            var $list = base.$el;
            var $li = $list.find('li').first();

            base.$liHeight = $li.outerHeight();
            base.$liWidth = $li.outerWidth();

            base.liCount = base.$el.children().length;

            base.listHeight = base.$liHeight * base.liCount;

            base.increment = (base.options.time / base.options.loops) / base.options.loops;

            $list.css('position', 'relative');

            $li.clone().appendTo($list);

            base.$wrapper = $list.wrap('<div class="jSlots-wrapper"></div>').parent();

            // remove original, so it can be recreated as a Slot
            base.$el.remove();

            // clone lists
            for (var i = base.options.number - 1; i >= 0; i--){
                base.allSlots.push( new base.Slot(i) );
            }

            // set order
            for(var i = base.options.minval; i <= base.options.maxval; ++i) {
                setTimeout((t) => {
                    //console.log(t);
                    base.order.push(t);
                }, 0, i)
            }
            setTimeout(() => {
                shuffle(base.order);
                setTimeout(() => {
                    console.log(base.order);
                }, 100);
            }, 100);
            
            
        };

        base.bindEvents = function() {
            $(base.options.spinner).bind(base.options.spinEvent, function(event) {
                if (!base.isSpinning) {
                    //alert(base.order[0]);
                    var val = base.order[base.options.spinturn++];
                    base.options.spinturn %= base.options.maxval - base.options.minval + 1;
                    ++base.options.spincnt;
                    var num = val.toString();
                    var arr = Array.from(num).reverse();
                    var newarr = [];
                    //alert(arr);
                    arr.forEach((item, index) => {
                        ++item;
                        newarr.push(item);
                    });
                    
                    setTimeout(() => {
                        for(var i = newarr.length; i < base.options.number; ++i) {
                            newarr.push(1);
                        }
                        setTimeout(() => {
                            base.playSlots(newarr);
                        }, 100); 
                    }, 50);
                }
            });
        };

        // Slot contstructor
        base.Slot = function(slotIndex) {

            this.spinSpeed = 0;
            this.el = base.$el.clone().appendTo(base.$wrapper)[0];
            this.$el = $(this.el);
            this.loopCount = 0;
            this.number = 0;
            this.slotIndex = slotIndex;
        };


        base.Slot.prototype = {

            // do one rotation
            spinEm : function() {

                var that = this;

                that.$el
                    .css( 'top', -base.listHeight )
                    .animate( { 'top' : '0px' }, that.spinSpeed, 'linear', function() {
                        that.lowerSpeed();
                    });

            },

            lowerSpeed : function() {

                this.spinSpeed += base.increment;
                this.loopCount++;

                if ( this.loopCount < base.options.loops ) {

                    this.spinEm();

                } else {

                    this.finish();

                }
            },

            // final rotation
            finish : function() {

                var that = this;

                var endNum = base.values[this.slotIndex];

                var finalPos = - ( (base.$liHeight * endNum) - base.$liHeight );
                var finalSpeed = ( (this.spinSpeed * 0.5) * (base.liCount) ) / endNum;

                that.$el
                    .css( 'top', -base.listHeight )
                    .animate( {'top': finalPos}, finalSpeed, base.options.easing, function() {
                        base.checkWinner(endNum, that);
                    });

            }

        };

        base.checkWinner = function(endNum, slot) {

            base.doneCount++;
            // set the slot number to whatever it ended on
            slot.number = endNum;

            // if its in the winners array
            if (
                ( $.isArray( base.options.winnerNumber ) && base.options.winnerNumber.indexOf(endNum) > -1 ) ||
                endNum === base.options.winnerNumber
                ) {

                // its a winner!
                base.winCount++;
                base.winners.push(slot.$el);

            }

            if (base.doneCount === base.options.number) {

                var finalNumbers = [];

                $.each(base.allSlots, function(index, val) {
                    finalNumbers[index] = val.number;
                });

                if ( $.isFunction( base.options.onEnd ) ) {
                    base.options.onEnd(finalNumbers);
                }

                if ( base.winCount && $.isFunction(base.options.onWin) ) {
                    base.options.onWin(base.winCount, base.winners, finalNumbers);
                }
                base.isSpinning = false;
            }
        };


        base.playSlots = function(values) {

            base.isSpinning = true;
            base.winCount = 0;
            base.doneCount = 0;
            base.winners = [];
            base.values = values;

            if ( $.isFunction(base.options.onStart) ) {
                base.options.onStart();
            }

            $.each(base.allSlots, function(index, val) {
                this.spinSpeed = 0;
                this.loopCount = 0;
                this.spinEm();
            });

        };


        base.onWin = function() {
            if ( $.isFunction(base.options.onWin) ) {
                base.options.onWin();
            }
        };


        // Run initializer
        base.init();
    };


    // --------------------------------------------------------------------- //
    // JQUERY FN
    // --------------------------------------------------------------------- //

    $.fn.jSlots = function(options){
        if (this.length) {
            return this.each(function(){
                (new $.jSlots(this, options));
            });
        }
    };

})(jQuery);
