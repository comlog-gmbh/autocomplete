/**
 * @copyright 2021 COMLOG GmbH Johannesberg
 * @author Anatolij Rau
 * @licence MIT
 * @version 0.3.1
 */
(function ($) {
	/**
	 * @constructor
	 */
	function cAutoComlete(jEl, opt) {
		var
			_this = this,
			jMenu,
			timeout
		;

		this.minLength = 1;
		this.delay = 300;
		this.source = [];
		this.menuClass = 'dropdown-menu';
		this.menuStyle = null;
		this.zIndex = 100;
		this.autoFocus = false;
		this.ignoreKeys = '|9|16|17|18|19|33|34|35|36|37|39|45|144|145|';

		this.empty = function (jM) {
			jM.html('<span class="font-weight-light pl-3 pr-3">No results</span>');
		};

		this.renderMenu = function () {
			var res = $('<div />');
			if (this.menuClass) res.addClass(this.menuClass);
			if (this.menuStyle) res.attr('style', this.menuStyle);
			res.css('min-width', jEl.outerWidth()+'px');
			return res;
		};

		/**
		 * Holt den aktuellen zIndex von einem element mit berücksichtigung der Parents
		 * @return {number}
		 */
		this.getZIndex = function () {
			var zIndex = 0;
			var obj = jEl;
			while (obj.prop('nodeName').toLowerCase() !== 'body') {
				if (obj.css('z-index') !== 'auto' && zIndex < obj.css('z-index')) zIndex = parseInt(obj.css('z-index'));
				obj = obj.parent();
			}
			return zIndex
		};

		this.renderSpinner = function (jM) {
			jM.html(
				$('<div class="d-flex justify-content-center" />')
					.append(
						$('<div class="spinner-border spinner-border-sm" role="status" />')
							.append('<span class="sr-only">Loading...</span>')
					)
			);
		};

		/**
		 *
		 * @param {jQuery} menu
		 * @param {{value: {string}, label:{string}}} item
		 * @return {jQuery}
		 */
		this.renderItem = function (menu, item) {
			return $('<a href="javascript: void(0)" />')
				.addClass('dropdown-item text-wrap')
				.data('data', item)
				.html(item.label || item.value)
				.appendTo(menu)
			;
		};

		this.matcher = function (rowData, search, cb) {
			var text = (rowData.label || rowData.text || rowData.value).toUpperCase();
			if (text.indexOf(search.toUpperCase()) > -1) {
				return cb(true);
			}

			cb(false);
		};

		/**
		 * Text hervorheben
		 * @param {jQuery} jItem
		 * @param {string} str
		 */
		this.highlight = function (jItem, str) {
			if (!str) str = jEl.val();
			var contents = jItem.contents();
			for (var i=0; i < contents.length; i++) {
				var c = contents.eq(i);
				if (c.get(0).nodeType === 3) {
					var text = c.text();
					var ltext = text.toLowerCase();
					var str = str.toLowerCase();
					var pos = 0;

					while ((pos = ltext.indexOf(str, pos)) != -1) {
						var match = text.substr(pos, str.length);
						var rep = '<b>'+match+'</b>';
						text = text.substr(0, pos) + rep + text.substr(pos + str.length);
						ltext = text.toLowerCase();
						pos = pos+rep.length;
					}
					c.replaceWith(text);
				}
				else {
					_this.highlight(c);
				}
			}
		};

		/**
		 * Removes the autocomplete functionality completely. This will return the element back to its pre-init state.
		 */
		this.destroy = function () {
			jMenu.remove()
			jEl.removeData('autocomplete');
			for (var i in this) {
				delete this[i];
			}
		};

		/**
		 * Focus auf einen Element legen
		 * @param {number|boolean} index -1 = Fokus aufheben
		 */
		this.active = function (index) {
			var jChildren = jMenu.children(':visible');

			// focus ermitteln
			if (index === null || typeof index === 'undefined') return jChildren.filter('.active').index();

			// focus aufheben
			jChildren.filter('.active').removeClass('active');
			if (index === false) return null;
			if (index === true) return this.active(0);

			// Focus außerhalb > length
			if (index >= jChildren.length) {
				jChildren.eq(jChildren.length-1).addClass('active');
			}
			// Focus außerhalb < 0
			else if (index < 0) {
				jChildren.eq(0).addClass('active');
			}
			else if (index >= 0) {
				jChildren.eq(index).addClass('active');
			}
			return null;
		}

		this.cursorDown = function () {
			var active = jMenu.children(':visible').filter('.active').index() || 0;
			_this.active(active+1);
			return false;
		};

		this.cursorUp = function () {
			var active = jMenu.children(':visible').filter('.active').index() || 0;
			_this.active(active-1);
			return;
		};

		this.select = function (event, data, jItem) {
			jEl.trigger('autocomplete.preselect', [data, jItem]);
			jEl.val(data.value || data.label || data.text);
			jEl.trigger('autocomplete.select', [data, jItem]);
		};

		this.toggle = function () {
			if (jMenu.is('.show')) this.hide();
			else this.show();

			return null;
		};

		this.show = function () {
			var offset = jEl.offset();
			var zIndex = this.getZIndex()+1;
			if (zIndex < this.zIndex) zIndex = this.zIndex;
			var maxWidth = $(window).innerWidth()-offset.left;
			jMenu
				.appendTo(document.body)
				.css('z-index', zIndex)
				.css('top', (offset.top+jEl.outerHeight())+'px')
				.css('left', offset.left+'px')
				.css('maxWidth', maxWidth+'px')
				.addClass('show')
			;

			return null;
		};

		this.hide = function () {
			jMenu.removeClass('show');
			return null;
		};

		var _itemGen = function (row, query) {
			var item = _this.renderItem(jMenu, row);
			// Click
			if (!(item instanceof jQuery)) item = $(item);
			item.click(function (e) {
				jEl.trigger('autocomplete.item.click', [row, res]);
				_this.select(e, row, res);
			});

			// highlight
			if (_this.highlight && $.isFunction(_this.highlight)) {
				_this.highlight(item, query);
			}
		};

		var _listGen = function (data, query, callback) {
			jMenu.html('');
			if (!data || data.length < 1) {
				if ($.isFunction(_this.empty)) _this.empty(jMenu);
				if ($.isFunction(callback)) callback();
				return;
			}
			if (!$.isArray(data)) {
				console.error('Autocomplete data is not Array');
				if ($.isFunction(callback)) callback();
				return;
			}

			var _m = function (index, cb) {
				if (index < data.length) {
					var row = data[index];
					if (typeof row == 'string' || typeof row == 'number') {
						row = {label: row};
					}
					if (!row.label && row.text) row.label = row.text;

					if ($.isFunction(_this.matcher)) {
						_this.matcher(row, query, function (res) {
							if (res) _itemGen(row, query);
							_m(index+1, cb);
						});
					}
					else {
						_itemGen(row, query);
						_m(index+1, cb);
					}

					return;
				}

				cb();
			}

			_m(0, function () {
				if (_this.autoFocus) _this.active(0);
				if ($.isFunction(callback)) callback();
			});
		}

		this.search = function (query, callback) {
			if (!query) query = jEl.val();
			if ($.isArray(this.source) || this.source instanceof Array) {
				_listGen(this.source, query, callback);
			}
			else if ($.isFunction(this.source)) {
				var request = {
					term: query
				};
				if (this.renderSpinner) this.renderSpinner(jMenu);
				this.source(request, function (data) {
					_listGen(data, query, callback);
				});
			}
			else if (typeof this.source == 'string') {
				var request = {
					term: query
				};
				if (this.renderSpinner) this.renderSpinner(jMenu);
				$.ajax({
					url: this.source,
					data: {term: term},
					dataType: 'json',
					success: function (data) {
						_listGen(data, query, callback);
					},
					error: function (err) {
						_listGen([], query, callback);
						throw err;
					}
				});
				this.source(request, function (data) {

				});
			}

			return null;
		};

		/**
		 * Set / get option (or all options)
		 * @param {string} [name] if not set will return all options
		 * @param {*} [value] if not set will return option defined by name
		 * @return {*}
		 */
		this.option = function (name, value) {
			if (typeof name == "undefined") return this;
			if (typeof value == "undefined") return this[name];

			this[name] = value;
			return null;
		};

		this.instance = function () { return this; };

		// Init
		if ($.isPlainObject(opt)) for (var i in opt) this[i] = opt[i];

		jMenu = this.renderMenu();

		jEl.blur(function () {
			setTimeout(function () {
				_this.hide();
			}, 500);
		});

		jEl.keydown(function (e) {
			// ignored
			if (_this.ignoreKeys.indexOf('|'+e.keyCode+'|') > -1) {
				return;
			}
			// cursor down
			if (e.keyCode === 40) {
				if (jMenu.is(':visible')) {
					_this.cursorDown();
					return false;
				}
			}
			// cursor down
			if (e.keyCode === 38) {
				if (jMenu.is(':visible')) {
					_this.cursorUp();
					return false;
				}
			}
			// Enter
			if (e.keyCode === 13) {
				if (jMenu.is(':visible')) {
					var actIndex = _this.active();
					if (actIndex >= 0) {
						var jItem = jMenu.children(':visible').eq(actIndex);
						_this.select(e, jItem.data('data'), jItem);
					}
					_this.hide();
					return false;
				}
			}

			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(function () {
				if (jEl.val().length >= _this.minLength) {
					_this.show();
					_this.search(jEl.val());
				}
				else {
					_this.hide();
				}
			}, _this.delay);
		});
	}

	// jQuery Plugin / Adapter
	$.fn.autocomplete = function (par1, par2, par3) {
		for (var i=0; i < this.length; i++) {
			var jEl = this.eq(i);
			var ret = null;

			// init
			if ($.isPlainObject(par1)) {
				if (jEl.data('autocomplete')) jEl.data('autocomplete').destroy();
				jEl.data('autocomplete', new cAutoComlete(jEl, par1))
			}
			else if (typeof par1 == 'string') {
				ret = jEl.data('autocomplete')[par1](par2, par3);
			}

			if (ret !== null) return ret;
		}

		return this;
	};
})(jQuery);